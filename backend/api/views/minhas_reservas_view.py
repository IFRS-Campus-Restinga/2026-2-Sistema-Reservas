from django.db.models import Prefetch, Q
from django.utils import timezone
from rest_framework import serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from datetime import timedelta

from api.models.reserva_model import Reserva
from api.models.termo_responsabilidade_model import TermoResponsabilidade
from api.permissions.regras_comuns import UsuarioAutenticado
from api.serializers.reserva_area_serializer import ReservaAreaSerializer
from api.serializers.reserva_veiculo_serializer import ReservaVeiculoSerializer
from api.serializers.reserva_recurso_geral_serializer import ReservaRecursoGeralSerializer
from api.serializers.recurso_geral_serializer import RecursoGeralSerializer
from api.serializers.veiculo_serializer import VeiculoSerializer
from api.serializers.tipo_recurso_serializer import TipoRecursoSerializer
from .view_helpers import listar
from api.services.situacao_reserva_service import filtro_situacao, situacao_reserva


class MinhaReservaSerializer(serializers.BaseSerializer):
    def to_representation(self, reserva):
        for atributo, modalidade, serializer in (
            ('reservaarea', 'area', ReservaAreaSerializer),
            ('reservaveiculo', 'veiculo', ReservaVeiculoSerializer),
            ('reservarecursogeral', 'recurso_geral', ReservaRecursoGeralSerializer),
        ):
            especifica = getattr(reserva, atributo, None)
            if especifica is None:
                continue
            dados = dict(serializer(especifica).data)
            dados['modalidade'] = modalidade
            dados['situacao'] = situacao_reserva(reserva)
            if modalidade == 'veiculo':
                dados['veiculo_detalhe'] = VeiculoSerializer(especifica.veiculo).data
            elif modalidade == 'recurso_geral':
                dados['recurso_detalhe'] = RecursoGeralSerializer(especifica.recurso_geral).data
                dados['tipo_detalhe'] = TipoRecursoSerializer(especifica.recurso_geral.tipo_recurso).data
            return dados


class MinhasReservasListView(APIView):
    permission_classes = [UsuarioAutenticado]

    def get(self, request):
        reservas = Reserva.objects.filter(usuario=request.user).select_related(
            'reservaarea__area__bloco', 'reservaarea__recorrencia', 'usuario',
            'reservaveiculo__veiculo', 'reservarecursogeral__recurso_geral__tipo_recurso',
        ).prefetch_related(Prefetch(
            'termos', queryset=TermoResponsabilidade.objects.filter(atual=True), to_attr='termos_atuais',
        )).order_by('-data', '-horario_inicio')
        # O status apresentado muda quando chega o horário de retirada.
        agora = timezone.localtime()
        futura = Q(data__gt=agora.date()) | Q(data=agora.date(), horario_inicio__gt=agora.time())
        situacao = request.query_params.get('situacao', 'todos').upper()
        if situacao == 'TODOS':
            reservas = reservas.exclude(status='CANCELADA')
        elif situacao == 'CONFIRMADA':
            reservas = reservas.filter(Q(status=situacao) | (Q(status='AGUARDANDO_TERMO_DEVOLUCAO') & futura))
        elif situacao == 'AGUARDANDO_TERMO_DEVOLUCAO':
            reservas = reservas.filter(status=situacao).exclude(futura)
        else:
            filtro = filtro_situacao(situacao)
            reservas = reservas.filter(filtro).distinct() if filtro is not None else reservas.none()
        return listar(request, reservas, MinhaReservaSerializer)


class ResumoReservasView(APIView):
    permission_classes = [UsuarioAutenticado]

    def get(self, request):
        agora = timezone.localtime()
        reservas = Reserva.objects.filter(usuario=request.user).exclude(
            status__in=['CANCELADA', 'REJEITADA'],
        ).select_related('reservaarea__area__bloco', 'reservaarea__recorrencia', 'usuario',
                         'reservaveiculo__veiculo', 'reservarecursogeral__recurso_geral__tipo_recurso')
        futura = Q(data__gt=agora.date()) | Q(data=agora.date(), horario_inicio__gte=agora.time())
        proximas = reservas.filter(futura).order_by('data', 'horario_inicio', 'pk')[:4]
        recentes = reservas.exclude(futura).order_by('-data', '-horario_inicio', '-pk')[:3]
        dias = reservas.filter(data__range=(agora.date(), agora.date() + timedelta(days=6)))
        return Response({
            'proximas': MinhaReservaSerializer(proximas, many=True).data,
            'recentes': MinhaReservaSerializer(recentes, many=True).data,
            'dias': list(dias.order_by('data').values_list('data', flat=True).distinct()),
        })
