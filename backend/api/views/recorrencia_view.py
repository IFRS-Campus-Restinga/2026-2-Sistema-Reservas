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
from api.services.auditoria import foto, foto_agrupada, registrar_auditoria
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


def registrar_auditoria_recorrencia(usuario, acao, recorrencia, alteradas):
    reservas = [reserva for reserva, _ in alteradas]

    registrar_auditoria(
        usuario,
        acao,
        recorrencia,
        antes=foto_agrupada([antes for _, antes in alteradas]),
        depois=foto_agrupada([foto(reserva) for reserva in reservas]),
        descricao=f"{reservas[0].nome} · {recorrencia.get_tipo_display()} · {len(reservas)} reserva(s)",
    )


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

            if recorrencia.reservas.filter(reservaarea__celula_timetable__isnull=False).exists():
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
                registrar_auditoria_recorrencia(request.user, AcaoAuditoria.CANCELAR, recorrencia, canceladas)

                return Response(serializar_recorrencia(recorrencia))

            if not request.data or set(request.data) - CAMPOS_EDICAO_RECORRENCIA:
                return Response(
                    {"detail": "Informe apenas os campos permitidos para edição."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            alteradas = editar_recorrencia(recorrencia, request.data)
            registrar_auditoria_recorrencia(request.user, AcaoAuditoria.EDITAR, recorrencia, alteradas)

        return Response(serializar_recorrencia(recorrencia))
