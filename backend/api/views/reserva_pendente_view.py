from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from api.enumerations.auditoria_enumerations import AcaoAuditoria, EntidadeAuditoria
from api.enumerations.status_reserva import StatusReserva
from api.models.reserva_model import Reserva
from api.permissions.regras_comuns import SomenteAdmin
from api.permissions.reserva_permissions import PodeConfirmarReserva
from api.serializers.reserva_pendente_serializer import ReservaPendenteSerializer
from api.services.auditoria import foto, registrar_auditoria

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

        return Response(ReservaPendenteSerializer(reservas, many=True).data)

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

        return Response(ReservaPendenteSerializer(reserva).data)
