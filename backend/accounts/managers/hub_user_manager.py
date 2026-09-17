from django.contrib.auth.base_user import BaseUserManager
from accounts.enumerations import Papel


class HubUserManager(BaseUserManager):
    def sincronizar(self, user_id: str, dados_hub: dict, papel: str):
        usuario, _ = self.update_or_create(
            id=user_id,
            defaults={
                'email': dados_hub.get('email', ''),
                'nome': dados_hub.get('username', ''),
                'perfil_acesso': dados_hub.get('access_profile', ''),
                'papel': papel,
                'is_active': dados_hub.get('is_active', False),
                'is_staff': papel == Papel.ADMIN,
            },
        )
        return usuario
