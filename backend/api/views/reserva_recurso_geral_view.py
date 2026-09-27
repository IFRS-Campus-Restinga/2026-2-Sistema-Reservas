from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.enumerations.status_reserva import StatusReserva
from api.models.recurso_geral_model import RecursoGeral
from api.models.reserva_recurso_geral_model import ReservaRecursoGeral
from api.serializers.reserva_recurso_geral_serializer import ReservaRecursoGeralSerializer
from api.validators.reserva_recurso_geral_validator import (
    STATUS_RESERVAS_ATIVAS,
    validar_disponibilidade,
)


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

        return Response(ReservaRecursoGeralSerializer(reservas, many=True).data)

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

            recurso.quantidade_reservada += dados["quantidades"]
            recurso.save(update_fields=["quantidade_reservada"])

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ReservaRecursoGeralDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        reserva = get_object_or_404(
            ReservaRecursoGeral,
            pk=pk,
            usuario=request.user,
        )

        return Response(ReservaRecursoGeralSerializer(reserva).data)

    def patch(self, request, pk):
        administrador = bool(
            request.user.is_staff or getattr(request.user, "papel", None) == "admin"
        )
        alteracao_status = set(request.data) == {"status"}
        novo_status = request.data.get("status") if alteracao_status else None
        status_administrativos = {StatusReserva.CONCLUIDA, StatusReserva.REJEITADA}

        if novo_status in status_administrativos and not administrador:
            raise PermissionDenied("Somente um administrador pode finalizar a reserva.")

        with transaction.atomic():
            reservas = ReservaRecursoGeral.objects.select_for_update()

            if not (
                administrador
                and novo_status in status_administrativos | {StatusReserva.CANCELADA}
            ):
                reservas = reservas.filter(usuario=request.user)

            reserva = get_object_or_404(reservas, pk=pk)

            if alteracao_status and novo_status in status_administrativos | {StatusReserva.CANCELADA}:
                if reserva.status not in STATUS_RESERVAS_ATIVAS:
                    raise ValidationError({
                        "status": "Esta reserva já foi finalizada."
                    })

                if (
                    novo_status == StatusReserva.CANCELADA
                    and reserva.status not in STATUS_ALTERAVEIS
                    and not administrador
                ):
                    raise ValidationError({
                        "status": "Esta reserva não pode mais ser cancelada."
                    })

                recurso = get_object_or_404(
                    RecursoGeral.objects.select_for_update(),
                    pk=reserva.recurso_geral_id,
                )

                if recurso.quantidade_reservada < reserva.quantidades:
                    raise ValidationError({
                        "quantidades": "O estoque está inconsistente. Recalcule as reservas antes de continuar."
                    })

                recurso.quantidade_reservada -= reserva.quantidades
                recurso.save(update_fields=["quantidade_reservada"])

                reserva.status = novo_status
                reserva.save(update_fields=["status"])

                return Response(ReservaRecursoGeralSerializer(reserva).data)

            if reserva.status not in STATUS_ALTERAVEIS:
                raise ValidationError({
                    "detail": "Esta reserva não pode mais ser alterada ou cancelada."
                })

            if not request.data or set(request.data) - CAMPOS_EDICAO:
                raise ValidationError({
                    "detail": "Informe apenas os campos permitidos para edição."
                })

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

            ids = {reserva.recurso_geral_id, dados["recurso_geral"].pk}
            recursos = {
                recurso.pk: recurso
                for recurso in RecursoGeral.objects.select_for_update()
                .filter(pk__in=ids)
                .order_by("pk")
            }

            recurso_anterior = recursos[reserva.recurso_geral_id]
            recurso_novo = recursos[dados["recurso_geral"].pk]
            quantidade_anterior = reserva.quantidades

            dados["recurso_geral"] = recurso_novo
            validar_disponibilidade(dados, excluir_reserva=reserva.pk)

            serializer.validated_data["recurso_geral"] = recurso_novo
            serializer.save()

            if recurso_anterior.pk == recurso_novo.pk:
                recurso_novo.quantidade_reservada += (
                    dados["quantidades"] - quantidade_anterior
                )
                recurso_novo.save(update_fields=["quantidade_reservada"])
            else:
                if recurso_anterior.quantidade_reservada < quantidade_anterior:
                    raise ValidationError({
                        "quantidades": "O estoque está inconsistente. Recalcule as reservas antes de continuar."
                    })

                recurso_anterior.quantidade_reservada -= quantidade_anterior
                recurso_novo.quantidade_reservada += dados["quantidades"]
                recurso_anterior.save(update_fields=["quantidade_reservada"])
                recurso_novo.save(update_fields=["quantidade_reservada"])

        return Response(serializer.data)
