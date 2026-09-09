from accounts.models import HubUser
from .cliente_hub import buscar_usuario_hub


def sincronizar_usuario(payload_jwt: dict):
    user_id = payload_jwt.get('user_id')
    if not user_id:
        return None

    dados_hub = buscar_usuario_hub(user_id)
    if dados_hub is not None:
        return HubUser.objects.sincronizar(user_id, dados_hub)

    return HubUser.objects.filter(id=user_id).first()
