from api.validators.veiculo_validator import validar_placa
from .base_model import BaseModel
from api.enumerations import StatusRecurso
from django.core.validators import MinLengthValidator, MinValueValidator
from django.db import models

class Veiculo(BaseModel):
    nome = models.CharField(max_length=30,validators=[MinLengthValidator(3)], verbose_name="Nome")
    placa = models.CharField(max_length=7, validators=[MinLengthValidator(7), validar_placa], unique=True, verbose_name="Placa")
    marca = models.CharField(max_length=50, validators=[MinLengthValidator(2)], verbose_name="Marca")
    modelo = models.CharField(max_length=50, validators=[MinLengthValidator(2)], verbose_name="Modelo")
    capacidade = models.IntegerField(validators=[MinValueValidator(1)], verbose_name="Capacidade")
    combustivel = models.CharField(max_length=20, verbose_name="Combustível")
    quilometragem = models.FloatField(validators=[MinValueValidator(0)], verbose_name="Quilometragem")
    cor = models.CharField(max_length=20,validators=[MinLengthValidator(2)], verbose_name="Cor")
    observacao = models.TextField(max_length=50, verbose_name="Observação", blank=True, null=True)
    status = models.CharField(
        max_length=20,choices=StatusRecurso.choices,default=StatusRecurso.ATIVO, verbose_name="Status"
    )

    def __str__(self):
        return self.nome
