from django.conf import settings
from django.core.exceptions import ValidationError
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

    def clean(self):
        super().clean()
        if self.grupo_id and self.usuario_id:
            papel = getattr(self.usuario, 'papel', None)
            if papel != self.grupo.tipo_membro_permitido:
                raise ValidationError(
                    {"usuario": f"Apenas usuários com papel de {self.grupo.get_tipo_membro_permitido_display().lower()} podem ser membros deste grupo."}
                )
            ja_membro = MembroGrupo.objects.filter(grupo_id=self.grupo_id, usuario_id=self.usuario_id)
            if self.pk:
                ja_membro = ja_membro.exclude(pk=self.pk)
            if ja_membro.exists():
                raise ValidationError({"usuario": "Este usuário já é membro deste grupo."})
        if self.grupo_id and self.data_fim_validade:
            if self.data_fim_validade < self.grupo.data_inicio_validade:
                raise ValidationError(
                    {"data_fim_validade": "Não pode ser anterior à data de início de validade do grupo."}
                )
            if self.grupo.data_fim_validade and self.data_fim_validade > self.grupo.data_fim_validade:
                raise ValidationError(
                    {"data_fim_validade": "Não pode ser posterior à data de fim de validade do grupo."}
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
            db_table = 'membro_grupo'
            verbose_name = 'Membro do Grupo'
            verbose_name_plural = 'Membros do Grupo'
            unique_together = ['grupo', 'usuario']
