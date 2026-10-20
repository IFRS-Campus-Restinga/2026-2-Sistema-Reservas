from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.enumerations.auditoria_enumerations import AcaoAuditoria
from api.enumerations.status_reserva import StatusReserva
from api.models.recorrencia_model import Recorrencia
from api.permissions.reserva_permissions import PodeGerenciarReserva
from api.serializers.reserva_area_serializer import serializar_recorrencia
from api.services.auditoria import foto, registrar_auditoria
from api.services.recorrencia_service import cancelar_recorrencia, editar_recorrencia
from .view_helpers import BuscarObjetoComPermissaoMixin


CAMPOS_EDICAO_RECORRENCIA = {
    "nome",
    "descricao",
    "horario_inicio",
    "horario_fim",
    "area",
    "aula",
}


class RecorrenciaReservaAreaDetailView(BuscarObjetoComPermissaoMixin, APIView):

    permission_classes = [PodeGerenciarReserva]
    queryset = Recorrencia.objects.select_related("usuario")

    def get(self, request, pk):
        return Response(serializar_recorrencia(self.get_object(pk)))

    def patch(self, request, pk):
        with transaction.atomic():
            recorrencia = get_object_or_404(
                Recorrencia.objects.select_for_update(),
                pk=pk,
            )

            self.check_object_permissions(request, recorrencia)

            if recorrencia.reservas.filter(celula_timetable__isnull=False).exists():
                return Response(
                    {
                        "detail": "Aulas da grade horária (Timetable) são gerenciadas exclusivamente pela sincronização com o EduPage e não podem ser alteradas ou canceladas manualmente."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if "status" in request.data:
                if (
                    set(request.data) != {"status"}
                    or request.data["status"] != StatusReserva.CANCELADA
                ):
                    return Response(
                        {"status": "A recorrência só pode ser cancelada, sem outras alterações."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                canceladas = cancelar_recorrencia(recorrencia)

                for reserva, antes in canceladas:
                    registrar_auditoria(request.user, AcaoAuditoria.CANCELAR, reserva, antes=antes, depois=foto(reserva))

                return Response(serializar_recorrencia(recorrencia))

            if not request.data or set(request.data) - CAMPOS_EDICAO_RECORRENCIA:
                return Response(
                    {"detail": "Informe apenas os campos permitidos para edição."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            alteradas = editar_recorrencia(recorrencia, request.data)

            for reserva, antes in alteradas:
                registrar_auditoria(request.user, AcaoAuditoria.EDITAR, reserva, antes=antes, depois=foto(reserva))

        return Response(serializar_recorrencia(recorrencia))
