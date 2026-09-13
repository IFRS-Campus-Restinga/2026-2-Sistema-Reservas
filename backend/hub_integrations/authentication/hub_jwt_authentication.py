from fs_auth_middleware.utils import decode_access_token, get_access_token_from_request
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from accounts.models import HubUser
from hub_integrations.services.sincronizacao import sincronizar_usuario


class HubJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        access_token = get_access_token_from_request(request)
        if not access_token:
            return None

        payload = decode_access_token(access_token, request)
        if not payload:
            raise AuthenticationFailed('Token do HUB inválido ou expirado.')

        user_id = payload.get('user_id')
        if not user_id:
            raise AuthenticationFailed('Token do HUB sem identificador de usuário.')

        usuario = HubUser.objects.filter(id=user_id).first()
        if usuario is None:
            usuario = sincronizar_usuario(payload)
            if usuario is None:
                raise AuthenticationFailed('Não foi possível sincronizar o usuário com o HUB.')

        if not usuario.is_active:
            raise AuthenticationFailed('Usuário inativo no HUB.')

        return (usuario, None)

    def authenticate_header(self, request):
        return 'Bearer'
