from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone

from api.enumerations.auditoria_enumerations import AcaoAuditoria, EntidadeAuditoria
from api.enumerations.status_reserva import StatusReserva
from api.models.reserva_model import Reserva
from api.permissions.regras_comuns import SomenteAdmin
from api.permissions.reserva_permissions import PodeCancelarReserva,PodeConfirmarReserva
from api.serializers.reserva_serializer import ReservaSerializer
from api.services.auditoria import foto, registrar_auditoria
from api.services.notificacao_service import criar_notificacao_cancelamento, criar_notificacao_confirmacao
from api.services.termo_service import reserva_exige_termo

def _entidade_reserva(reserva):
    if getattr(reserva, "reservaarea", None) is not None:
        return EntidadeAuditoria.RESERVA_AREA
    if getattr(reserva, "reservaveiculo", None) is not None:
        return EntidadeAuditoria.RESERVA_VEICULO
    if getattr(reserva, "reservarecursogeral", None) is not None:
        return EntidadeAuditoria.RESERVA_RECURSO_GERAL
    return None

class ReservasPendentesListView(APIView):
    permission_classes = [SomenteAdmin]

    def get(self, request):
        reservas = (
            Reserva.objects
            .filter(status=StatusReserva.PENDENTE)
            .exclude(reservaveiculo__isnull=False)
            .exclude(reservarecursogeral__recurso_geral__tem_termo_de_responsabilidade=True)
            .select_related(
                "usuario",
                "reservaarea__area__bloco",
                "reservaveiculo__veiculo",
                "reservarecursogeral__recurso_geral__tipo_recurso",
            )
            .order_by("data", "horario_inicio")
        )

        return Response(ReservaSerializer(reservas, many=True).data)

class ConfirmarReservaView(APIView):
    permission_classes = [PodeConfirmarReserva]

    def post(self, request, pk):
        with transaction.atomic():
            reserva = get_object_or_404(
                Reserva.objects.select_for_update().select_related(
                    "usuario",
                    "reservaarea__area__bloco",
                    "reservaveiculo__veiculo",
                    "reservarecursogeral__recurso_geral__tipo_recurso",
                ),
                pk=pk,
            )

            if reserva.status != StatusReserva.PENDENTE:
                raise ValidationError({
                    "status": "Somente reservas pendentes podem ser confirmadas."
                })

            if reserva_exige_termo(reserva):
                raise ValidationError({
                    "detail": (
                        "Reservas que exigem termo devem ser analisadas "
                        "em Solicitações."
                    )
                })

            entidade = _entidade_reserva(reserva)
            if entidade is None:
                raise ValidationError({
                    "detail": "Não foi possível identificar o tipo desta reserva."
                })

            antes = foto(reserva)
            reserva.status = StatusReserva.CONFIRMADA
            reserva.save(update_fields=["status"])

            registrar_auditoria(
                request.user,
                AcaoAuditoria.EDITAR,
                reserva,
                antes=antes,
                depois=foto(reserva),
                entidade=entidade,
                descricao=f"Confirmação da reserva {reserva.nome}",
            )

            criar_notificacao_confirmacao(reserva)

        return Response(ReservaSerializer(reserva).data)

class CancelarReservaAdminView(APIView):
    permission_classes = [PodeCancelarReserva]

    def post(self, request, pk):
        motivo = str(request.data.get("motivo", "")).strip()

        if not motivo:
            raise ValidationError({
                "motivo": "Informe o motivo do cancelamento."
            })

        if len(motivo) > 500:
            raise ValidationError({
                "motivo": "O motivo do cancelamento deve ter no máximo 500 caracteres."
            })

        with transaction.atomic():
            reserva = get_object_or_404(
                Reserva.objects.select_for_update().select_related(
                    "usuario",
                    "reservaarea__area__bloco",
                    "reservaveiculo__veiculo",
                    "reservarecursogeral__recurso_geral__tipo_recurso",
                ),
                pk=pk,
            )

            status_cancelaveis = {
                StatusReserva.PENDENTE,
                StatusReserva.CONFIRMADA,
                StatusReserva.AGUARDANDO_TERMO,
                StatusReserva.AGUARDANDO_TERMO_DEVOLUCAO,
            }

            if reserva.status not in status_cancelaveis:
                raise ValidationError({
                    "status": "Esta reserva não pode mais ser cancelada."
                })

            entidade = _entidade_reserva(reserva)

            if entidade is None:
                raise ValidationError({
                    "detail": "Não foi possível identificar o tipo desta reserva."
                })

            antes = foto(reserva)

            reserva.status = StatusReserva.CANCELADA
            reserva.motivo_cancelamento = motivo
            reserva.cancelada_em = timezone.now()
            reserva.cancelada_por = request.user

            reserva.save(update_fields=[
                "status",
                "motivo_cancelamento",
                "cancelada_em",
                "cancelada_por",
            ])

            registrar_auditoria(
                request.user,
                AcaoAuditoria.CANCELAR,
                reserva,
                antes=antes,
                depois=foto(reserva),
                entidade=entidade,
                descricao=f"Cancelamento da reserva {reserva.nome}. Motivo: {motivo}",
            )

            criar_notificacao_cancelamento(reserva)

        return Response(ReservaSerializer(reserva).data)