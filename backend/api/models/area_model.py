from django.core.validators import MinLengthValidator
from django.db import models

from api.enumerations.area_enumerations.area_enums import StatusRecurso, TipoArea
from .base_model import BaseModel
from .bloco_model import Bloco

class Area(BaseModel):
    """
    Representa a entidade Area vinculada a um Bloco conforme especificado no diagrama ER.
    Herda de BaseModel para manter o padrao de auditoria do sistema.
    """
    nome = models.CharField(
        max_length=50,
        validators=[MinLengthValidator(5)],
        null=False,
        blank=False,
        help_text="Nome da área contendo entre 5 e 50 caracteres."
    )
    capacidade = models.IntegerField(
        null=False,
        blank=False,
        help_text="Capacidade total de ocupacao da área."
    )
    caracteristica = models.TextField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Descrição complementar ou características da área (opcional)."
    )
    disponibilidade = models.BooleanField(
        null=False,
        blank=False,
        help_text="Indica se a área está disponível para uso/reserva."
    )
    status = models.CharField(
        max_length=20,
        choices=StatusRecurso.choices,
        null=False,
        blank=False,
        help_text="Estado operacional da área (ATIVO, MANUTENCAO, INATIVO)."
    )
    tipo = models.CharField(
        max_length=50,
        choices=TipoArea.choices,
        null=False,
        blank=False,
        help_text="Classificação funcional da área conforme TipoArea."
    )
    equipamento = models.JSONField(
        default=list,
        blank=True,
        help_text="Lista de equipamentos presentes na área (choices: EquipamentoArea)."
    )
    bloco = models.ForeignKey(
        Bloco,
        on_delete=models.CASCADE,
        related_name='areas',
        null=False,
        blank=False,
        help_text="Relacionamento obrigatório (1..N) com a entidade Bloco."
    )

    class Meta:
        db_table = 'area'
        verbose_name = 'Área'
        verbose_name_plural = 'Áreas'
        unique_together = ['nome', 'bloco']

    def __str__(self):
        return f"{self.nome} - {self.bloco.nome} ({self.get_tipo_display()})"