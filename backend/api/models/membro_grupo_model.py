from django.conf import settings
from django.db import models

from .base_model import BaseModel
from .grupo_model import Grupo


class MembroGrupo(BaseModel):

    grupo = models.ForeignKey(
        Grupo,
        on_delete=models.CASCADE,
        related_name='membros',
        null=False,
        blank=False,
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='autorizacoes_grupo',
        null=False,
        blank=False,
    )
    data_fim_validade = models.DateField(
        null=True,
        blank=True,
        help_text=(
            "Data de expiração da autorização deste membro no grupo. "
            "Se vazio, vale a validade do grupo."
        )
    )

    def __str__(self):
        return f"{self.usuario} em {self.grupo}"

    @property
    def grupo_relacionado(self):
        return self.grupo


    class Meta:
            db_table = 'membro_grupo'
            verbose_name = 'Membro do Grupo'
            verbose_name_plural = 'Membros do Grupo'
            unique_together = ['grupo', 'usuario']
