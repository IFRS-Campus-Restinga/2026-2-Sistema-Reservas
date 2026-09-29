from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date, parse_time
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from api.enumerations import StatusReserva
from api.models.reserva_veiculo_model import ReservaVeiculo
from api.models.veiculo_model import Veiculo
from api.permissions.regras_comuns import UsuarioAutenticado
from api.permissions.reserva_permissions import PodeGerenciarReserva
from api.serializers.reserva_veiculo_serializer import ReservaVeiculoSerializer
from api.services.reserva_veiculo_service import (
    validar_cancelamento,
    validar_disponibilidade,
    validar_reserva,
)
from .view_helpers import BuscarObjetoComPermissaoMixin


CAMPOS_EDICAO = {
    "nome",
    "descricao",
    "data",
    "horario_inicio",
    "horario_fim",
    "veiculo",
    "destino",
    "finalidade",
    "quantidade_passageiros",
    "data_devolucao_prevista",
}


class ReservaVeiculoListCreateView(APIView):
    permission_classes = [UsuarioAutenticado]

    def get(self, request):
        reservas = (
            ReservaVeiculo.objects
            .filter(usuario=request.user)
            .select_related("veiculo", "usuario")
            .order_by("-data", "-horario_inicio")
        )
        return Response(ReservaVeiculoSerializer(reservas, many=True).data)

    def post(self, request):
        serializer = ReservaVeiculoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            dados = serializer.validated_data
            veiculo = get_object_or_404(
                Veiculo.objects.select_for_update(), pk=dados["veiculo"].pk
            )
            dados["veiculo"] = veiculo
            validar_reserva(request.user, dados)
            serializer.save(usuario=request.user)

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ReservaVeiculoDetailView(BuscarObjetoComPermissaoMixin, APIView):
    permission_classes = [PodeGerenciarReserva]
    queryset = ReservaVeiculo.objects.select_related("veiculo", "usuario")

    def get(self, request, pk):
        return Response(ReservaVeiculoSerializer(self.get_object(pk)).data)

    def patch(self, request, pk):
        alteracao_status = set(request.data) == {"status"}
        if "status" in request.data and not alteracao_status:
            raise ValidationError({
                "status": "O cancelamento não pode ser combinado com outras alterações."
            })

        with transaction.atomic():
            reserva = get_object_or_404(
                ReservaVeiculo.objects.select_for_update(), pk=pk
            )
            self.check_object_permissions(request, reserva)

            if alteracao_status:
                if request.data.get("status") != StatusReserva.CANCELADA:
                    raise ValidationError({
                        "status": "A API permite apenas cancelar a reserva."
                    })
                validar_cancelamento(request.user, reserva)
                reserva.status = StatusReserva.CANCELADA
                reserva.save(update_fields=["status"])
                return Response(ReservaVeiculoSerializer(reserva).data)

            if not request.data or set(request.data) - CAMPOS_EDICAO:
                raise ValidationError({
                    "detail": "Informe apenas os campos permitidos para edição."
                })

            serializer = ReservaVeiculoSerializer(
                reserva, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            dados = serializer.validated_data
            veiculo = dados.get("veiculo", reserva.veiculo)
            veiculo = get_object_or_404(
                Veiculo.objects.select_for_update(), pk=veiculo.pk
            )
            dados["veiculo"] = veiculo
            validar_reserva(request.user, dados, reserva)
            serializer.save()

        return Response(serializer.data)


class DisponibilidadeReservaVeiculoView(APIView):
    permission_classes = [PodeGerenciarReserva]

    def get(self, request):
        parametros = request.query_params
        dados = {
            "veiculo": get_object_or_404(
                Veiculo, pk=parametros.get("veiculo")
            ),
            "data": parse_date(parametros.get("data", "")),
            "horario_inicio": parse_time(parametros.get("horario_inicio", "")),
            "data_devolucao_prevista": parse_date(
                parametros.get("data_devolucao_prevista", "")
            ),
            "horario_fim": parse_time(parametros.get("horario_fim", "")),
        }
        if not all(dados.values()):
            raise ValidationError({
                "detail": "Informe veículo, datas e horários válidos."
            })
        excluir = request.query_params.get("excluir_reserva")
        reserva = None
        if excluir:
            reserva = get_object_or_404(ReservaVeiculo, pk=excluir)
            self.check_object_permissions(request, reserva)
        validar_disponibilidade(dados, reserva, request.user)
        return Response({"disponivel": True})


