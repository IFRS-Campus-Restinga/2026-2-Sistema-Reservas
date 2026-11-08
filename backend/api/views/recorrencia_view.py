from django.db import transaction
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.enumerations.auditoria_enumerations import AcaoAuditoria
from api.enumerations.status_reserva import StatusReserva
from api.models.recorrencia_model import Recorrencia
from api.permissions.reserva_permissions import PodeGerenciarReserva
from api.services.auditoria import foto, foto_agrupada, registrar_auditoria
from api.services.recorrencia_service import (
    RECORRENCIA_AREA,
    RECORRENCIA_VEICULO,
    cancelar_recorrencia,
    editar_recorrencia,
    serializar_recorrencia,
)
from .view_helpers import BuscarObjetoComPermissaoMixin


def registrar_auditoria_recorrencia(usuario, acao, recorrencia, alteradas, entidade):
    reservas = [reserva for reserva, _ in alteradas]

    registrar_auditoria(
        usuario,
        acao,
        recorrencia,
        antes=foto_agrupada([antes for _, antes in alteradas]),
        depois=foto_agrupada([foto(reserva) for reserva in reservas]),
        entidade=entidade,
        descricao=f"{reservas[0].nome} · {recorrencia.get_tipo_display()} · {len(reservas)} reserva(s)",
    )


class RecorrenciaReservaDetailView(BuscarObjetoComPermissaoMixin, APIView):

    permission_classes = [PodeGerenciarReserva]
    queryset = Recorrencia.objects.select_related("usuario")
    modalidade = None

    def get_object(self, pk):
        recorrencia = super().get_object(pk)
        self.validar_modalidade(recorrencia)
        return recorrencia

    def validar_modalidade(self, recorrencia):
        if not self.modalidade.modelo.objects.filter(recorrencia=recorrencia).exists():
            raise Http404

    def validar_alteracao(self, recorrencia):
        return None

    def get(self, request, pk):
        return Response(serializar_recorrencia(self.modalidade, self.get_object(pk), request.user))

    def patch(self, request, pk):
        modalidade = self.modalidade

        with transaction.atomic():
            recorrencia = get_object_or_404(
                Recorrencia.objects.select_for_update(),
                pk=pk,
            )

            self.check_object_permissions(request, recorrencia)
            self.validar_modalidade(recorrencia)

            resposta_invalida = self.validar_alteracao(recorrencia)

            if resposta_invalida is not None:
                return resposta_invalida

            if "status" in request.data:
                if (
                    set(request.data) != {"status"}
                    or request.data["status"] != StatusReserva.CANCELADA
                ):
                    return Response(
                        {"status": "A recorrência só pode ser cancelada, sem outras alterações."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                canceladas = cancelar_recorrencia(modalidade, recorrencia, request.user)
                registrar_auditoria_recorrencia(
                    request.user, AcaoAuditoria.CANCELAR, recorrencia, canceladas, modalidade.entidade_auditoria
                )

                return Response(serializar_recorrencia(modalidade, recorrencia, request.user))

            if not request.data or set(request.data) - modalidade.campos_edicao:
                return Response(
                    {"detail": "Informe apenas os campos permitidos para edição."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            alteradas = editar_recorrencia(modalidade, recorrencia, request.user, request.data)
            registrar_auditoria_recorrencia(
                request.user, AcaoAuditoria.EDITAR, recorrencia, alteradas, modalidade.entidade_auditoria
            )

        return Response(serializar_recorrencia(modalidade, recorrencia, request.user))


class RecorrenciaReservaAreaDetailView(RecorrenciaReservaDetailView):
    modalidade = RECORRENCIA_AREA

    def validar_alteracao(self, recorrencia):
        if recorrencia.reservas.filter(reservaarea__celula_timetable__isnull=False).exists():
            return Response(
                {
                    "detail": "Aulas da grade horária (Timetable) são gerenciadas exclusivamente pela sincronização com o EduPage e não podem ser alteradas ou canceladas manualmente."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return None


class RecorrenciaReservaVeiculoDetailView(RecorrenciaReservaDetailView):
    modalidade = RECORRENCIA_VEICULO
