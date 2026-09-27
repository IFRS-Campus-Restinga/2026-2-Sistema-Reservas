from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.enumerations.status_reserva import StatusReserva
from api.models.area_model import Area
from api.models.reserva_area_model import ReservaArea
from api.permissions.is_owner_or_admin import IsOwnerOrAdmin
from api.serializers.reserva_area_serializer import ReservaAreaSerializer
from api.validators.reserva_area_validator import validar_disponibilidade_area


STATUS_ALTERAVEIS = [
    StatusReserva.PENDENTE,
    StatusReserva.CONFIRMADA,
]

CAMPOS_EDICAO = {
    "nome",
    "descricao",
    "data",
    "horario_inicio",
    "horario_fim",
    "area",
    "aula",
}


class ReservaAreaListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reservas = ReservaArea.objects.filter(
            status=StatusReserva.CONFIRMADA
        ).order_by("-data", "-horario_inicio")

        serializer = ReservaAreaSerializer(reservas, many=True)

        return Response(serializer.data)

    def post(self, request):
        serializer = ReservaAreaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            dados = serializer.validated_data

            area = get_object_or_404(
                Area.objects.select_for_update(),
                pk=dados["area"].pk,
            )

            dados["area"] = area

            validar_disponibilidade_area(dados)
            serializer.save(usuario=request.user, status=StatusReserva.CONFIRMADA)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )


class MinhasReservasAreaListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reservas = ReservaArea.objects.filter(
            usuario=request.user
        ).order_by("-data", "-horario_inicio")

        serializer = ReservaAreaSerializer(reservas, many=True)

        return Response(serializer.data)


class ReservaAreaDetailView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get(self, request, pk):
        reserva = get_object_or_404(ReservaArea, pk=pk)

        serializer = ReservaAreaSerializer(reserva)

        return Response(serializer.data)

    def patch(self, request, pk):
        with transaction.atomic():
            reserva = get_object_or_404(
                ReservaArea.objects.select_for_update(),
                pk=pk,
            )

            self.check_object_permissions(request, reserva)

            if reserva.status not in STATUS_ALTERAVEIS:
                return Response(
                    {"detail": "Esta reserva não pode mais ser alterada ou cancelada."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if (
                set(request.data) == {"status"}
                and request.data["status"] == StatusReserva.CANCELADA
            ):
                reserva.status = StatusReserva.CANCELADA
                reserva.save(update_fields=["status"])

                serializer = ReservaAreaSerializer(reserva)

                return Response(serializer.data)

            if not request.data or set(request.data) - CAMPOS_EDICAO:
                return Response(
                    {"detail": "Informe apenas os campos permitidos para edição."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer = ReservaAreaSerializer(
                reserva,
                data=request.data,
                partial=True,
            )
            serializer.is_valid(raise_exception=True)

            dados = {
                campo: getattr(reserva, campo)
                for campo in ("area", "data", "horario_inicio", "horario_fim")
            }

            dados.update(serializer.validated_data)

            ids = {
                reserva.area_id,
                dados["area"].pk,
            }

            areas = {
                area.pk: area
                for area in Area.objects.select_for_update()
                .filter(pk__in=ids)
                .order_by("pk")
            }

            dados["area"] = areas[dados["area"].pk]

            validar_disponibilidade_area(dados, excluir_reserva=reserva.pk)

            serializer.validated_data["area"] = dados["area"]
            serializer.save()

        return Response(serializer.data)
