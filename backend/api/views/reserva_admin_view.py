from django.db.models import Q
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView

from api.models.reserva_model import Reserva
from api.pagination import PaginacaoPadrao
from api.permissions.regras_comuns import SomenteAdmin
from api.serializers.reserva_serializer import ReservaSerializer


class ReservasAdminListView(APIView):
    permission_classes = [SomenteAdmin]

    def get(self, request):
        busca = request.query_params.get('busca', '').strip()
        tipo = request.query_params.get('tipo', 'todos')

        reservas = (
            Reserva.objects
            .select_related(
                'usuario',
                'reservaarea__area__bloco',
                'reservaveiculo__veiculo',
                'reservarecursogeral__recurso_geral__tipo_recurso',
            )
            .order_by('-data', '-horario_inicio', '-pk')
        )

        if tipo == 'area':
            reservas = reservas.filter(
                reservaarea__isnull=False
            )
        elif tipo == 'veiculo':
            reservas = reservas.filter(
                reservaveiculo__isnull=False
            )
        elif tipo == 'recurso_geral':
            reservas = reservas.filter(
                reservarecursogeral__isnull=False
            )
        elif tipo != 'todos':
            raise ValidationError({
                'tipo': 'Tipo de reserva inválido.'
            })

        if busca:
            reservas = reservas.filter(
                Q(nome__icontains=busca)
                | Q(usuario__nome__icontains=busca)
                | Q(usuario__email__icontains=busca)
                | Q(reservaarea__area__nome__icontains=busca)
                | Q(reservaveiculo__veiculo__nome__icontains=busca)
                | Q(reservaveiculo__veiculo__placa__icontains=busca)
                | Q(reservarecursogeral__recurso_geral__nome__icontains=busca)
                | Q(reservarecursogeral__recurso_geral__tipo_recurso__descricao__icontains=busca)
                | Q(status__icontains=busca)
            ).distinct()

        paginacao = PaginacaoPadrao()
        pagina = paginacao.paginate_queryset(
            reservas,
            request,
        )

        return paginacao.get_paginated_response(
            ReservaSerializer(
                pagina,
                many=True,
            ).data
        )