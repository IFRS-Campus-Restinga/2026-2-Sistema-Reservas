
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.enumerations.status_reserva import StatusReserva
from api.models.recurso_geral_model import RecursoGeral
from api.models.reserva_recurso_geral_model import ReservaRecursoGeral
from api.serializers.reserva_recurso_geral_serializer import ReservaRecursoGeralSerializer
from api.validators.reserva_recurso_geral_validator import validar_disponibilidade


STATUS_ALTERAVEIS = [
    StatusReserva.PENDENTE,
    StatusReserva.AGUARDANDO_TERMO,
]

CAMPOS_EDICAO = {
    "nome",
    "descricao",
    "data",
    "horario_inicio",
    "horario_fim",
    "recurso_geral",
    "data_devolucao_prevista",
    "quantidades",
}


class ReservaRecursoGeralListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reservas = ReservaRecursoGeral.objects.filter(
            usuario=request.user
        ).order_by("-data", "-horario_inicio")

        serializer = ReservaRecursoGeralSerializer(reservas, many=True)

        return Response(serializer.data)

    def post(self, request):
        serializer = ReservaRecursoGeralSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            dados = serializer.validated_data

            recurso = get_object_or_404(
                RecursoGeral.objects.select_for_update(),
                pk=dados["recurso_geral"].pk,
            )

            dados["recurso_geral"] = recurso

            validar_disponibilidade(dados)
            serializer.save(usuario=request.user)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )


class ReservaRecursoGeralDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        reserva = get_object_or_404(
            ReservaRecursoGeral,
            pk=pk,
            usuario=request.user,
        )

        serializer = ReservaRecursoGeralSerializer(reserva)

        return Response(serializer.data)

    def patch(self, request, pk):
        with transaction.atomic():
            reserva = get_object_or_404(
                ReservaRecursoGeral.objects.select_for_update(),
                pk=pk,
                usuario=request.user,
            )

            if reserva.status not in STATUS_ALTERAVEIS:
                return Response(
                    {
                        "detail": "Esta reserva não pode mais ser alterada ou cancelada."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if (
                set(request.data) == {"status"}
                and request.data["status"] == StatusReserva.CANCELADA
            ):
                reserva.status = StatusReserva.CANCELADA
                reserva.save(update_fields=["status"])

                serializer = ReservaRecursoGeralSerializer(reserva)

                return Response(serializer.data)

            if not request.data or set(request.data) - CAMPOS_EDICAO:
                return Response(
                    {
                        "detail": "Informe apenas os campos permitidos para edição."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = ReservaRecursoGeralSerializer(
                reserva,
                data=request.data,
                partial=True,
            )
            serializer.is_valid(raise_exception=True)

            dados = {
                campo: getattr(reserva, campo)
                for campo in (
                    "recurso_geral",
                    "data",
                    "horario_inicio",
                    "horario_fim",
                    "data_devolucao_prevista",
                    "quantidades",
                )
            }

            dados.update(serializer.validated_data)

            ids = {
                reserva.recurso_geral_id,
                dados["recurso_geral"].pk,
            }

            recursos = {
                recurso.pk: recurso
                for recurso in RecursoGeral.objects.select_for_update()
                .filter(pk__in=ids)
                .order_by("pk")
            }

            dados["recurso_geral"] = recursos[dados["recurso_geral"].pk]

            validar_disponibilidade(
                dados,
                excluir_reserva=reserva.pk,
            )

            serializer.validated_data["recurso_geral"] = dados["recurso_geral"]
            serializer.save()

        return Response(serializer.data)
