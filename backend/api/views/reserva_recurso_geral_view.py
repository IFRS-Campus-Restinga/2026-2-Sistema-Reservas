from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date, parse_time
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from api.enumerations.status_reserva import StatusReserva
from api.models.recurso_geral_model import RecursoGeral
from api.models.reserva_recurso_geral_model import ReservaRecursoGeral
from api.permissions.regras_comuns import UsuarioAutenticado, usuario_e_admin
from api.permissions.reserva_permissions import PodeGerenciarReserva
from api.serializers.reserva_recurso_geral_serializer import ReservaRecursoGeralSerializer
from api.validators.reserva_recurso_geral_validator import STATUS_RESERVAS_ATIVAS, validar_autorizacao, validar_disponibilidade, quantidade_disponivel
from .view_helpers import BuscarObjetoComPermissaoMixin

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
    permission_classes = [UsuarioAutenticado]

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
            validar_autorizacao(request.user, dados)
            validar_disponibilidade(dados)
            serializer.save(usuario=request.user)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

class DisponibilidadeRecursoGeralView(APIView):
    permission_classes = [PodeGerenciarReserva]

    def get(self, request):
        parametros = request.query_params
        recurso = get_object_or_404(RecursoGeral, pk=parametros.get("recurso_geral"))
        data = parse_date(parametros.get("data", ""))
        inicio = parse_time(parametros.get("horario_inicio", ""))
        fim = parse_time(parametros.get("horario_fim", ""))
        devolucao = parse_date(parametros.get("data_devolucao_prevista", ""))
        if not all([data, inicio, fim, devolucao]):
            raise ValidationError({"detail": "Informe datas e horários válidos."})
        if devolucao < data or (devolucao == data and fim <= inicio):
            raise ValidationError({"detail": "A devolução deve ser posterior à retirada."})

        excluir_reserva = parametros.get("excluir_reserva")
        if excluir_reserva:
            self.check_object_permissions(
                request,
                get_object_or_404(ReservaRecursoGeral, pk=excluir_reserva),
            )

        dados = {
            "recurso_geral": recurso,
            "data": data,
            "horario_inicio": inicio,
            "horario_fim": fim,
            "data_devolucao_prevista": devolucao,
        }
        disponiveis = quantidade_disponivel(dados, excluir_reserva)
        return Response({
            "disponiveis": disponiveis if recurso.status == "ATIVO" else 0,
            "quantidade_total": recurso.quantidade_total,
        })

class ReservaRecursoGeralDetailView(BuscarObjetoComPermissaoMixin, APIView):
    permission_classes = [PodeGerenciarReserva]
    queryset = ReservaRecursoGeral.objects.all()

    def get(self, request, pk):
        return Response(ReservaRecursoGeralSerializer(self.get_object(pk)).data)

    def patch(self, request, pk):
        administrador = usuario_e_admin(request.user)
        alteracao_status = set(request.data) == {"status"}
        novo_status = request.data.get("status") if alteracao_status else None
        status_administrativos = {StatusReserva.CONCLUIDA, StatusReserva.REJEITADA}

        if novo_status in status_administrativos and not administrador:
            raise PermissionDenied("Somente um administrador pode finalizar a reserva.")

        with transaction.atomic():
            reserva = get_object_or_404(ReservaRecursoGeral.objects.select_for_update(), pk=pk)
            self.check_object_permissions(request, reserva)

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

            recurso = get_object_or_404(
                RecursoGeral.objects.select_for_update(),
                pk=dados["recurso_geral"].pk,
            )

            dados["recurso_geral"] = recurso
            validar_autorizacao(reserva.usuario, dados)
            validar_disponibilidade(dados, excluir_reserva=reserva.pk)

            serializer.validated_data["recurso_geral"] = recurso
            serializer.save()

        return Response(serializer.data)
