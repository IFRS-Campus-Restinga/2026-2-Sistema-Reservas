from datetime import date
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from api.enumerations import TipoRecorrencia
from .base_model import BaseModel


class Recorrencia(BaseModel):
    tipo = models.CharField(choices=TipoRecorrencia.choices, verbose_name="Tipo de recorrência")
    data_inicio = models.DateField(verbose_name="Data início")
    data_fim = models.DateField(verbose_name="Data fim")
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="recorrencias",
        verbose_name="Usuário criador",
    )

    class Meta:
        verbose_name = "Recorrência"
        verbose_name_plural = "Recorrências"

    def __str__(self):
        return f"{self.get_tipo_display()} ({self.data_inicio} a {self.data_fim})"

    def clean(self):
        super().clean()
        if not isinstance(self.data_inicio, date) or not isinstance(self.data_fim, date):
            return
        if self.data_fim <= self.data_inicio:
            raise ValidationError({
                "data_fim": "A data de fim da recorrência deve ser posterior à data de início."
            })

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)
