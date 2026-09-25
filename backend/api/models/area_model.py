from django.core.validators import MinLengthValidator
from django.db import models

from api.enumerations.area_enumerations.area_enums import StatusRecurso, TipoArea
from .base_model import BaseModel
from .bloco_model import Bloco
from api.enumerations.area_enumerations.area_enums import EquipamentoArea
from api.validators.area_validator import validar_equipamentos_area

class Area(BaseModel):

    """
    Representa a entidade Area vinculada a um Bloco conforme especificado no diagrama ER.
    """

    class Meta:
        db_table = 'area'
        verbose_name = 'Área'
        verbose_name_plural = 'Áreas'
        unique_together = ['nome', 'bloco'] # unique constraint

    nome = models.CharField(
        max_length=25,
        validators=[MinLengthValidator(3)],
        null=False,
        blank=False,
        help_text="Nome da área contendo entre 4 e 50 caracteres."
    )
    capacidade = models.IntegerField(
        default=20,
        null=False,
        blank=False,
        help_text="Capacidade total de ocupação da área."
    )
    caracteristica = models.TextField(
        max_length=300,
        null=True,
        blank=True,
        help_text="Descrição complementar ou características da área (opcional)."
    )
    disponibilidade = models.BooleanField(
        default=True,
        null=False,
        blank=False,
        help_text="Indica se a área está disponível para reserva."
    )
    status = models.CharField(
        max_length=10,
        choices=StatusRecurso.choices,
        default=StatusRecurso.ATIVO,
        null=False,
        blank=False,
        help_text="Estado operacional da área"
    )
    tipo = models.CharField(
        max_length=100,
        choices=TipoArea.choices,
        default=TipoArea.SALA,
        null=False,
        blank=False,
        help_text="Tipo de área"
    )
    equipamento = models.JSONField(
        models.CharField(max_length=50),
        default=list,
        blank=True,
        validators=[validar_equipamentos_area],
        help_text="Equipamentos encontrados na área"
    )
    edupage_id = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        unique=True,
        help_text="ID interno da sala no JSON do EduPage (ex: '-61')"
    )
    bloco = models.ForeignKey(
        Bloco,
        on_delete=models.CASCADE,
        related_name='areas',
        null=False,
        blank=False,
        help_text="Relacionamento com Bloco obrigatório."
    )

    def __str__(self):
        return f"{self.nome} - {self.bloco.nome}"  

    def clean(self):
        
        if self.nome:
            self.nome = self.nome.strip()
        if self.caracteristica:
            self.caracteristica = self.caracteristica.strip()
        super().clean()

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)