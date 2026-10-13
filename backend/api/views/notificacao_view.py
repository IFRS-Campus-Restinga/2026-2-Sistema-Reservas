from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models.notificacao_model import Notificacao
from api.permissions.regras_comuns import UsuarioAutenticado
from api.serializers.notificacao_serializer import NotificacaoSerializer


class MinhasNotificacoesListView(APIView):
    permission_classes = [UsuarioAutenticado]

    def get(self, request):
        notificacoes = (
            Notificacao.objects
            .filter(usuario=request.user)
            .select_related("reserva")
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
            Notificacao.objects.select_related("reserva"),
            pk=pk,
            usuario=request.user,
        )

        if not notificacao.lida:
            notificacao.lida = True
            notificacao.lida_em = timezone.now()
            notificacao.save(update_fields=["lida", "lida_em"])

        return Response(NotificacaoSerializer(notificacao).data)
