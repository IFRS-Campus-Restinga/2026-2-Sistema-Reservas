from accounts.models import HubUser
from .cliente_hub import buscar_usuario_hub
from .mapeamento_papel import mapear_papel


def sincronizar_usuario(payload_jwt: dict):
    user_id = payload_jwt.get('user_id')
    if not user_id:
        return None

    dados_hub = buscar_usuario_hub(user_id)
    if dados_hub is not None:
        papel = mapear_papel(dados_hub.get('access_profile', ''), payload_jwt.get('groups', []))
        return HubUser.objects.sincronizar(user_id, dados_hub, papel)

    return HubUser.objects.filter(id=user_id).first()
