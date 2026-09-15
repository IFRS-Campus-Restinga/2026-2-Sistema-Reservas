from django.shortcuts import redirect
from fs_auth_middleware.utils import decode_access_token, get_access_token_from_request
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from hub_integrations.services.sincronizacao import sincronizar_usuario


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def sessao_token(request):
    access_token = get_access_token_from_request(request)
    if access_token:
        payload = decode_access_token(access_token, request)
        if payload:
            sincronizar_usuario(payload)

    return redirect('/')
