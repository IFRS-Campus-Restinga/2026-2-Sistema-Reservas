from django.db import models
from django.contrib.postgres.fields import ArrayField
from models.base_model import BaseModel
from enumerations.acessibilidade import Acessibilidade


class Bloco(BaseModel):

    class Meta:
        db_table = 'bloco'
        verbose_name = 'Bloco'
        verbose_name_plural = 'Blocos'

    numero = models.CharField(max_length=2)
    nome = models.CharField(max_length=100)
    banheiro = models.BooleanField(default=True)
    acessibilidade = ArrayField(
        models.CharField(max_length=50, choices=Acessibilidade.choices),
        default=list,
        blank=True
    )

    def __str__(self):
        return f"Bloco {self.numero} - {self.nome}"