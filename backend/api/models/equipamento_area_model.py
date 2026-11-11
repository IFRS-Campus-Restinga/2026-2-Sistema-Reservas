from django.db import models

from .base_model import BaseModel


class EquipamentoArea(BaseModel):
    nome = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = 'equipamento_area'
        verbose_name = 'Equipamento de área'
        verbose_name_plural = 'Equipamentos de área'
        ordering = ['nome']

    def __str__(self):
        return self.nome
