from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.enumerations.status_reserva import StatusReserva
from api.models.area_model import Area
from api.models.reserva_area_model import ReservaArea
from api.permissions.regras_comuns import UsuarioAutenticado
from api.permissions.reserva_permissions import PodeGerenciarReserva
from api.serializers.reserva_area_serializer import ReservaAreaSerializer, serializar_recorrencia
from api.services.recorrencia_service import criar_reservas_recorrentes
from api.validators.reserva_area_validator import validar_autorizacao, validar_disponibilidade_area
from api.enumerations.auditoria_enumerations import AcaoAuditoria
from api.services.auditoria import foto, registrar_auditoria


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
    permission_classes = [UsuarioAutenticado]

    def get(self, request):
        from api.services.timetable.reservas_timetable_service import ReservasTimetableService

        filtros_data = {}
        for parametro in ("data_inicio", "data_fim"):
            valor = request.query_params.get(parametro)

            if valor is None:
                continue

            try:
                data = parse_date(valor)
            except ValueError:
                data = None

            if data is None:
                return Response(
                    {"detail": f"O parâmetro {parametro} deve estar no formato AAAA-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            filtros_data[parametro] = data

        reservas_normais = ReservaArea.objects.filter(
            status=StatusReserva.CONFIRMADA,
            celula_timetable__isnull=True,
        ).select_related("area__bloco", "usuario", "recorrencia")

        if "data_inicio" in filtros_data:
            reservas_normais = reservas_normais.filter(data__gte=filtros_data["data_inicio"])
        if "data_fim" in filtros_data:
            reservas_normais = reservas_normais.filter(data__lte=filtros_data["data_fim"])

        reservas_timetable = ReservasTimetableService.projetar_reservas_no_intervalo(
            data_inicio=filtros_data.get("data_inicio"),
            data_fim=filtros_data.get("data_fim"),
        )

        reservas = list(reservas_normais) + reservas_timetable
        reservas.sort(key=lambda r: (r.data, r.horario_inicio), reverse=True)

        serializer = ReservaAreaSerializer(reservas, many=True)

        return Response(serializer.data)

    def post(self, request):
        serializer = ReservaAreaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            dados = serializer.validated_data
            dados_recorrencia = dados.pop("recorrencia", None)

            area = get_object_or_404(
                Area.objects.select_for_update(),
                pk=dados["area"].pk,
            )

            dados["area"] = area

            if dados_recorrencia:
                recorrencia = criar_reservas_recorrentes(request.user, dados, dados_recorrencia)

                return Response(
                    serializar_recorrencia(recorrencia),
                    status=status.HTTP_201_CREATED,
                )

            validar_autorizacao(request.user, dados)
            validar_disponibilidade_area(dados)
            serializer.save(usuario=request.user, status=StatusReserva.CONFIRMADA)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )


class MinhasReservasAreaListView(APIView):
    permission_classes = [UsuarioAutenticado]

    def get(self, request):
        reservas = ReservaArea.objects.filter(
            usuario=request.user
        ).select_related("area__bloco", "recorrencia").order_by("-data", "-horario_inicio")

        serializer = ReservaAreaSerializer(reservas, many=True)

        return Response(serializer.data)


class ReservaAreaDetailView(APIView):
    permission_classes = [PodeGerenciarReserva]

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
            antes = foto(reserva)

            if reserva.celula_timetable_id is not None:
                return Response(
                    {
                        "detail": "Aulas da grade horária (Timetable) são gerenciadas exclusivamente pela sincronização com o EduPage e não podem ser alteradas ou canceladas manualmente."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

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
                registrar_auditoria(request.user, AcaoAuditoria.CANCELAR, reserva, antes=antes, depois=foto(reserva))

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

            validar_autorizacao(reserva.usuario, dados)
            validar_disponibilidade_area(dados, excluir_reserva=reserva.pk)

            serializer.validated_data["area"] = dados["area"]
            serializer.save()
            registrar_auditoria(request.user, AcaoAuditoria.EDITAR, reserva, antes=antes, depois=foto(reserva))

        return Response(serializer.data)
