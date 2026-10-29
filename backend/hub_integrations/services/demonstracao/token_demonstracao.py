import uuid

import jwt
from django.conf import settings
from django.utils import timezone

from .usuarios_demonstracao import USUARIOS_DEMONSTRACAO


def gerar_token_demonstracao(perfil):
    dados = USUARIOS_DEMONSTRACAO[perfil]
    payload = {
        'token_type': 'access',
        'iat': int(timezone.now().timestamp()),
        'jti': uuid.uuid4().hex,
        'user_id': str(dados['id']),
        'groups': dados['groups'],
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')


def gravar_cookie_demonstracao(response, token):
    response.set_cookie(
        settings.AUTH_COOKIE_NAME,
        token,
        httponly=settings.AUTH_COOKIE_HTTPONLY,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
    )


def apagar_cookie_demonstracao(response):
    response.delete_cookie(settings.AUTH_COOKIE_NAME, samesite=settings.AUTH_COOKIE_SAMESITE)
