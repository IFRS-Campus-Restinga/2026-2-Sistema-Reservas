import uuid
from django.conf import settings
from django.db import models


class System(models.Model):
    """
    Sistemas externos autorizados a chamar este backend via cookie 'system'.
    Campos exigidos pelo contrato do fs_auth_middleware (FS_AUTH_SYSTEM_MODEL).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, verbose_name="ID")
    name = models.CharField(max_length=50, unique=True, verbose_name="Nome")
    system_url = models.URLField(max_length=255, verbose_name="URL do sistema")
    is_active = models.BooleanField(default=True, verbose_name="Status")
    api_key = models.CharField(max_length=255, verbose_name="Chave de API")
    current_state = models.CharField(max_length=20, default='Em desenvolvimento', verbose_name="Estado atual")
    secret_key = models.CharField(max_length=200, verbose_name="Chave secreta")
    dev_team = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='dev_systems', verbose_name="Equipe DEV")

    def __str__(self):
        return self.name
