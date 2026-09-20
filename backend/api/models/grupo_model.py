from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinLengthValidator
from django.db import models

from api.enumerations.tipo_recurso_reservavel import TipoRecursoReservavel
from .base_model import BaseModel
from .tipo_recurso_model import TipoRecurso


class Grupo(BaseModel):
    nome = models.CharField(
        max_length=100,
        validators=[MinLengthValidator(3)],
        null=False,
        blank=False,
        help_text="Nome do grupo de autorização."
    )
    tipo_recurso_autorizado = models.CharField(
        max_length=20,
        choices=TipoRecursoReservavel.choices,
        null=False,
        blank=False,
        help_text="Tipo de recurso que o grupo está autorizado a reservar."
    )
    tipo_recurso = models.ForeignKey(
        TipoRecurso,
        on_delete=models.PROTECT,
        related_name='grupos_autorizados',
        null=True,
        blank=True,
        help_text=(
            "Tipo específico de Recurso Geral autorizado (ex.: bola). "
            "Obrigatório quando tipo_recurso_autorizado = RECURSO_GERAL, "
            "e deve ficar vazio nos demais casos."
        )
    )
    data_inicio_validade = models.DateField(
        null=False,
        blank=False,
        help_text="Data a partir da qual a autorização do grupo é válida."
    )
    data_fim_validade = models.DateField(
        null=True,
        blank=True,
        help_text="Data de expiração da autorização do grupo (opcional)."
    )
    criador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='grupos_criados',
        null=False,
        blank=False,
        help_text="Usuário que criou o grupo."
    )

    def __str__(self):
        return self.nome

    @property
    def grupo_relacionado(self):
        return self

    def clean(self):
        super().clean()
        if self.nome:
            self.nome = self.nome.strip()
        if self.tipo_recurso_autorizado == TipoRecursoReservavel.RECURSO_GERAL and not self.tipo_recurso_id:
            raise ValidationError(
                {"tipo_recurso": "Obrigatório informar o tipo de recurso geral autorizado (ex.: bola)."}
            )
        if self.tipo_recurso_autorizado != TipoRecursoReservavel.RECURSO_GERAL and self.tipo_recurso_id:
            raise ValidationError(
                {"tipo_recurso": "Só deve ser informado quando tipo_recurso_autorizado = RECURSO_GERAL."}
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
            db_table = 'grupo'
            verbose_name = 'Grupo'
            verbose_name_plural = 'Grupos'
