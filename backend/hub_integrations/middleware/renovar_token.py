import logging

import requests
from django.conf import settings
from fs_auth_middleware.utils import (
    decode_access_token,
    get_access_token_from_request,
    get_refresh_token_from_request,
)

logger = logging.getLogger(__name__)


class RenovarTokenExpiradoMiddleware:

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        token_renovado = self._renovar_se_necessario(request)

        response = self.get_response(request)

        if token_renovado:
            response.set_cookie(
                settings.AUTH_COOKIE_NAME,
                token_renovado,
                httponly=settings.AUTH_COOKIE_HTTPONLY,
                secure=settings.AUTH_COOKIE_SECURE,
                samesite=settings.AUTH_COOKIE_SAMESITE,
            )

        return response

    def _renovar_se_necessario(self, request):
        access_token = get_access_token_from_request(request)
        if access_token and decode_access_token(access_token, request):
            return None

        refresh_token = get_refresh_token_from_request(request)
        if not refresh_token:
            return None

        novo_token = self._pedir_renovacao_ao_hub(refresh_token)
        if novo_token:
            
            request.COOKIES[settings.AUTH_COOKIE_NAME] = novo_token

        return novo_token

    def _pedir_renovacao_ao_hub(self, refresh_token):
        url = f"{settings.HUB_BASE_URL}/session/token/refresh/"
        cookies = {settings.REFRESH_COOKIE_NAME: refresh_token}

        try:
            resposta = requests.get(url, cookies=cookies, timeout=5)
            resposta.raise_for_status()
            return resposta.cookies.get(settings.AUTH_COOKIE_NAME)
        except requests.RequestException as erro:
            logger.error("Falha ao renovar token no HUB: %s", erro)
            return None
