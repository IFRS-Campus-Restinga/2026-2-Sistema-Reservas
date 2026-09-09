from django.contrib.auth.base_user import AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
from django.db import models

from accounts.enumerations import Papel
from accounts.managers import HubUserManager


class HubUser(AbstractBaseUser, PermissionsMixin):
    """
    Sincronização a partir do payload do JWT emitido pelo HUB.
    """
    id = models.UUIDField(primary_key=True, editable=False, verbose_name="ID")
    email = models.EmailField(unique=True, verbose_name="Email")
    nome = models.CharField(max_length=100, blank=True, verbose_name="Nome")
    perfil_acesso = models.CharField(max_length=12, blank=True, verbose_name="Perfil de acesso")
    papel = models.CharField(max_length=12, choices=Papel.choices, blank=True, verbose_name="Papel")
    is_active = models.BooleanField(default=False, verbose_name="Status")
    is_staff = models.BooleanField(default=False, verbose_name="Membro da equipe")
    sincronizado_em = models.DateTimeField(auto_now=True, verbose_name="Última sincronização")

    objects = HubUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
