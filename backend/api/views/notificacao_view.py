from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Prefetch

from api.enumerations.status_termo import StatusTermo
from api.models.termo_responsabilidade_model import TermoResponsabilidade
from api.models.notificacao_model import Notificacao
from api.permissions.regras_comuns import UsuarioAutenticado
from api.serializers.notificacao_serializer import NotificacaoSerializer

def notificacoes_com_relacoes():
    return (
        Notificacao.objects
        .select_related(
            'reserva',
            'reserva__cancelada_por',
            'reserva__reservaarea',
            'reserva__reservaveiculo',
            'reserva__reservarecursogeral',
        )
        .prefetch_related(
            Prefetch(
                'reserva__termos',
                queryset=(
                    TermoResponsabilidade.objects
                    .filter(status=StatusTermo.REJEITADO)
                    .exclude(motivo_rejeicao='')
                    .order_by('-data_validacao', '-pk')
                ),
                to_attr='termos_rejeitados',
            )
        )
    )

class MinhasNotificacoesListView(APIView):
    permission_classes = [UsuarioAutenticado]

    def get(self, request):
        notificacoes = (
            notificacoes_com_relacoes()
            .filter(usuario=request.user)
            .order_by("-criada_em")
        )

        return Response({
            "nao_lidas": notificacoes.filter(lida=False).count(),
            "notificacoes": NotificacaoSerializer(notificacoes, many=True).data,
        })


class MarcarNotificacaoLidaView(APIView):
    permission_classes = [UsuarioAutenticado]

    def patch(self, request, pk):
        notificacao = get_object_or_404(
            notificacoes_com_relacoes(),
            pk=pk,
            usuario=request.user,
        )

        if not notificacao.lida:
            notificacao.lida = True
            notificacao.lida_em = timezone.now()
            notificacao.save(update_fields=["lida", "lida_em"])

        return Response(NotificacaoSerializer(notificacao).data)

class MarcarTodasNotificacoesLidasView(APIView):
    permission_classes = [UsuarioAutenticado]

    def patch(self, request):
        Notificacao.objects.filter(
            usuario=request.user,
            lida=False,
        ).update(
            lida=True,
            lida_em=timezone.now(),
        )

        return Response({
            "detail": "Todas as notificações foram marcadas como lidas.",
            "nao_lidas": 0,
        })
