from django.conf import settings
from fs_auth_middleware.utils import decode_access_token, get_access_token_from_request

from hub_integrations.services.demonstracao import (
    PERFIL_DEMONSTRACAO_PADRAO,
    apagar_cookie_demonstracao,
    eh_usuario_demonstracao,
    garantir_usuario_demonstracao,
    gerar_token_demonstracao,
    gravar_cookie_demonstracao,
)


class LoginDemonstracaoMiddleware:

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not settings.MODO_DEMONSTRACAO:
            return self._encerrar_sessao_demonstracao(request)

        token_demonstracao = self._entrar_se_necessario(request)

        response = self.get_response(request)

        if token_demonstracao and settings.AUTH_COOKIE_NAME not in response.cookies:
            gravar_cookie_demonstracao(response, token_demonstracao)

        return response

    def _payload_valido(self, request):
        access_token = get_access_token_from_request(request)
        if not access_token:
            return None
        return decode_access_token(access_token, request)

    def _entrar_se_necessario(self, request):
        if self._payload_valido(request):
            return None

        garantir_usuario_demonstracao(PERFIL_DEMONSTRACAO_PADRAO)
        token = gerar_token_demonstracao(PERFIL_DEMONSTRACAO_PADRAO)
        request.COOKIES[settings.AUTH_COOKIE_NAME] = token
        return token

    def _encerrar_sessao_demonstracao(self, request):
        payload = self._payload_valido(request)
        if not payload or not eh_usuario_demonstracao(payload.get('user_id')):
            return self.get_response(request)

        request.COOKIES.pop(settings.AUTH_COOKIE_NAME, None)
        response = self.get_response(request)
        apagar_cookie_demonstracao(response)
        return response
