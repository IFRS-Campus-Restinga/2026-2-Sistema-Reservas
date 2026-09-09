import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def buscar_usuario_hub(user_id: str) -> dict | None:
    """
    Busca os dados do usuário na API do HUB
    """
    url = f"{settings.HUB_BASE_URL}/api/users/get/{user_id}/"
    params = {"fields": "id,email,username,access_profile,is_active"}
    cookies = {"system": settings.HUB_SYSTEM_API_KEY}

    try:
        resposta = requests.get(url, params=params, cookies=cookies, timeout=5)
        resposta.raise_for_status()
        return resposta.json()
    except requests.RequestException as erro:
        logger.error("Falha ao buscar usuário %s no HUB: %s", user_id, erro)
        return None
