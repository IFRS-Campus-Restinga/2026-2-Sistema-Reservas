from django.core.validators import (
    MaxLengthValidator,
    MinLengthValidator,
    integer_validator,
)
from django.db import models
from api.enumerations.bloco_enumerations.acessibilidade import Acessibilidade
from api.validators.bloco_validator import validar_acessibilidade_bloco
from .base_model import BaseModel


class Bloco(BaseModel):
    """
    Representa a entidade de um Bloco físico do campus

    Atributos:
        numero (CharField): Código numérico de identificação do bloco (no máximo 2 dígitos).
        nome (CharField): Nome descritivo do bloco (máximo 100 caracteres).
        banheiro (BooleanField): Indica a presença de estrutura sanitária (padrão: True).
        acessibilidade (JSONField): Lista com as opções de acessibilidade disponíveis (padrão: lista vazia).
    """

    class Meta:
        db_table = 'bloco'
        verbose_name = 'Bloco'
        verbose_name_plural = 'Blocos'

    numero = models.CharField(
        max_length=2,
        null=False,
        blank=False,
        validators=[
            MinLengthValidator(1),
            MaxLengthValidator(2),
            integer_validator,
        ],
        help_text="Código numérico do bloco contendo 1 a 2 dígitos."
    )
    nome = models.CharField(
        max_length=100,
        null=False,
        blank=False,
        validators=[MinLengthValidator(3)],
        help_text="Nome descritivo do bloco contendo no mínimo 3 caracteres."
    )
    banheiro = models.BooleanField(
        default=True,
        null=False,
        blank=False,
        help_text="Indica se o bloco possúi sanitários."
    )
    acessibilidade = models.JSONField(
        models.CharField(max_length=50),
        default=list,
        blank=True,
        validators=[validar_acessibilidade_bloco],
        help_text="Opções de acessibilidade disponíveis no bloco."
    )

    def __str__(self):
        return f"Bloco {self.numero} - {self.nome}"

    def clean(self):
        super().clean()
        if self.nome:
            self.nome = self.nome.strip()
        if self.numero:
            self.numero = self.numero.strip()
        
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)