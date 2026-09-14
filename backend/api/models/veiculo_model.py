from .base_model import BaseModel
from api.enumerations import StatusRecurso
from django.core.validators import MinLengthValidator, MinValueValidator
from django.db import models

class Veiculo(BaseModel):
    nome = models.CharField(max_length=30, verbose_name="Nome")
    placa = models.CharField(max_length=7, validators=[MinLengthValidator(7)], verbose_name="Placa")
    marca = models.CharField(max_length=50, verbose_name="Marca")
    modelo = models.CharField(max_length=50, verbose_name="Modelo")
    capacidade = models.IntegerField(validators=[MinValueValidator(1)], verbose_name="Capacidade")
    combustivel = models.CharField(max_length=20, verbose_name="Combustível")
    quilometragem = models.FloatField(validators=[MinValueValidator(0)], verbose_name="Quilometragem")
    observacao = models.TextField(max_length=50, verbose_name="Observação")
    status = models.CharField(
        max_length=20,choices=StatusRecurso.choices,verbose_name="Status"
    )

    def __str__(self):
        return self.nome
