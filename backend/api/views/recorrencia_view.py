from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.enumerations.status_reserva import StatusReserva
from api.models.recorrencia_model import Recorrencia
from api.permissions.reserva_permissions import PodeGerenciarReserva
from api.serializers.reserva_area_serializer import serializar_recorrencia
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

            if "status" in request.data:
                if (
                    set(request.data) != {"status"}
                    or request.data["status"] != StatusReserva.CANCELADA
                ):
                    return Response(
                        {"status": "A recorrência só pode ser cancelada, sem outras alterações."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                cancelar_recorrencia(recorrencia)

                return Response(serializar_recorrencia(recorrencia))

            if not request.data or set(request.data) - CAMPOS_EDICAO_RECORRENCIA:
                return Response(
                    {"detail": "Informe apenas os campos permitidos para edição."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            editar_recorrencia(recorrencia, request.data)

        return Response(serializar_recorrencia(recorrencia))
