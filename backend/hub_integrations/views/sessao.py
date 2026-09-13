from fs_auth_middleware.utils import decode_access_token, get_access_token_from_request
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from hub_integrations.services.sincronizacao import sincronizar_usuario


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def sessao_token(request):
    access_token = get_access_token_from_request(request)
    if not access_token:
        return Response({'message': 'Não autenticado no HUB.'}, status=status.HTTP_401_UNAUTHORIZED)

    payload = decode_access_token(access_token, request)
    if not payload:
        return Response({'message': 'Token inválido ou expirado.'}, status=status.HTTP_401_UNAUTHORIZED)

    usuario = sincronizar_usuario(payload)
    if usuario is None:
        return Response(
            {'message': 'Não foi possível sincronizar o usuário com o HUB.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response({
        'message': 'Login sincronizado com sucesso.',
        'usuario': {
            'id': str(usuario.id),
            'email': usuario.email,
            'nome': usuario.nome,
            'perfil_acesso': usuario.perfil_acesso,
            'papel': usuario.papel,
        },
        'grupos': payload.get('groups', []),
    })
