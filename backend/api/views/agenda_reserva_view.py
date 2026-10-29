from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models.area_model import Area
from api.models.reserva_area_model import ReservaArea
from api.models.reserva_veiculo_model import ReservaVeiculo
from api.models.veiculo_model import Veiculo
from api.permissions.regras_comuns import UsuarioAutenticado
from api.services.reserva_veiculo_service import STATUS_RESERVAS_FINAIS
from api.services.timetable.reservas_timetable_service import ReservasTimetableService


class AgendaReservasView(APIView):
    """Fornece os dados resumidos usados na agenda da tela do recurso."""

    permission_classes = [UsuarioAutenticado]

    def get(self, request):
        tipo = request.query_params.get("tipo", "").upper()
        recurso_id = request.query_params.get("recurso")
        data = timezone.localdate()

        if tipo == "VEICULO":
            recurso = get_object_or_404(Veiculo, pk=recurso_id)
            reservas = (
                ReservaVeiculo.objects
                .filter(
                    veiculo=recurso,
                    data__lte=data,
                    data_devolucao_prevista__gte=data,
                )
                .exclude(status__in=STATUS_RESERVAS_FINAIS)
                .select_related("usuario")
            )
            response = [
                {
                    "id": reserva.pk,
                    "nome": reserva.nome,
                    "data": reserva.data,
                    "horario_inicio": reserva.horario_inicio,
                    "data_devolucao_prevista": reserva.data_devolucao_prevista,
                    "horario_fim": reserva.horario_fim,
                    "usuario_nome": reserva.usuario.nome,
                    "destino": reserva.destino,
                }
                for reserva in reservas.order_by("data", "horario_inicio")
            ]
        elif tipo == "AREA":
            recurso = get_object_or_404(Area, pk=recurso_id)
            reservas_normais = list(
                ReservaArea.objects
                .filter(area=recurso, data=data, celula_timetable__isnull=True)
                .exclude(status__in=STATUS_RESERVAS_FINAIS)
                .select_related("usuario")
            )
            reservas_timetable = ReservasTimetableService.projetar_reservas_no_intervalo(
                data_inicio=data,
                data_fim=data,
                area=recurso,
            )
            reservas = reservas_normais + reservas_timetable
            reservas.sort(key=lambda r: r.horario_inicio)
            response = [
                {
                    "id": reserva.pk,
                    "nome": reserva.nome,
                    "data": reserva.data,
                    "horario_inicio": reserva.horario_inicio,
                    "horario_fim": reserva.horario_fim,
                    "usuario_nome": reserva.usuario.nome,
                }
                for reserva in reservas
            ]
        else:
            raise ValidationError({
                "tipo": "Informe um tipo de agenda válido: VEICULO ou AREA."
            })

        return Response(response)
