from django.conf import settings
from django.http import Http404
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from hub_integrations.services.demonstracao import (
    USUARIOS_DEMONSTRACAO,
    garantir_usuario_demonstracao,
    gerar_token_demonstracao,
    gravar_cookie_demonstracao,
)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def entrar_demonstracao(request, perfil):
    if not settings.MODO_DEMONSTRACAO:
        raise Http404
    if perfil not in USUARIOS_DEMONSTRACAO:
        return Response({'detail': 'Perfil de demonstração inválido.'}, status=status.HTTP_400_BAD_REQUEST)

    usuario = garantir_usuario_demonstracao(perfil)
    response = Response({'perfil': perfil, 'papel': usuario.papel})
    gravar_cookie_demonstracao(response, gerar_token_demonstracao(perfil))
    return response
