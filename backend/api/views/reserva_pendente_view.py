from rest_framework.response import Response
from rest_framework.views import APIView

from api.enumerations.status_reserva import StatusReserva
from api.models.reserva_model import Reserva
from api.permissions.regras_comuns import SomenteAdmin
from api.serializers.reserva_pendente_serializer import ReservaPendenteSerializer


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
