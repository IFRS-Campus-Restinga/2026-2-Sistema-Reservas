from .view_helpers import listar
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone

from api.enumerations.auditoria_enumerations import AcaoAuditoria, EntidadeAuditoria
from api.enumerations.status_reserva import StatusReserva
from api.enumerations.status_termo import StatusTermo
from api.enumerations import TipoTermo
from api.models.reserva_model import Reserva
from api.permissions.regras_comuns import SomenteAdmin
from api.permissions.reserva_permissions import PodeCancelarReserva,PodeConfirmarReserva
from api.serializers.reserva_pendente_serializer import ReservaPendenteSerializer
from api.services.auditoria import foto, registrar_auditoria
from api.services.termo_service import analisar_termo
from api.services.notificacao_service import criar_notificacao_cancelamento, criar_notificacao_confirmacao

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
            .select_related(
                "usuario",
                "reservaarea__area__bloco",
                "reservaveiculo__veiculo",
                "reservarecursogeral__recurso_geral__tipo_recurso",
            )
            .order_by("data", "horario_inicio")
        )

        return listar(request, reservas, ReservaPendenteSerializer)

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

            entidade = _entidade_reserva(reserva)
            if entidade is None:
                raise ValidationError({
                    "detail": "Não foi possível identificar o tipo desta reserva."
                })

            antes = foto(reserva)
            devolucao = None
            if entidade == EntidadeAuditoria.RESERVA_VEICULO:
                devolucao = reserva.termos.filter(
                    tipo=TipoTermo.DEVOLUCAO_VEICULO, atual=True, status=StatusTermo.PENDENTE,
                ).first()

            if devolucao is not None:
                analisar_termo(
                    reserva, devolucao.pk, request.user, StatusTermo.APROVADO, "", TipoTermo.DEVOLUCAO_VEICULO,
                )
                descricao = f"Conclusão da reserva {reserva.nome}"
            else:
                reserva.status = StatusReserva.CONFIRMADA
                reserva.save(update_fields=["status"])
                descricao = f"Confirmação da reserva {reserva.nome}"

            registrar_auditoria(
                request.user,
                AcaoAuditoria.EDITAR,
                reserva,
                antes=antes,
                depois=foto(reserva),
                entidade=entidade,
                descricao=descricao,
            )

            criar_notificacao_confirmacao(reserva)

        return Response(ReservaPendenteSerializer(reserva).data)

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

        return Response(ReservaPendenteSerializer(reserva).data)