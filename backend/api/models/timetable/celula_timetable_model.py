from django.db import models
from api.models.base_model import BaseModel
from api.models.area_model import Area
from .periodo_letivo_model import PeriodoLetivo
from .horario_timetable_model import HorarioTimetable
from api.enumerations.timetable_enumerations.dia_semana_enum import DiaSemana


class CelulaTimetable(BaseModel):
    """
    Representa um "bloco" de aula na grade horária.
    Cruza o local (Area), o tempo (HorarioTimetable) e os dados da aula.
    """

    class Meta:
        db_table = 'celula_timetable'
        verbose_name = 'Célula Timetable'
        verbose_name_plural = 'Células Timetable'

    area = models.ForeignKey(
        Area,
        on_delete=models.CASCADE,
        related_name='celulas_timetable',
        help_text="A área (sala/laboratório) onde ocorre a aula"
    )
    periodo_letivo = models.ForeignKey(
        PeriodoLetivo,
        on_delete=models.CASCADE,
        related_name='celulas_timetable',
        help_text="O semestre vigente desta aula"
    )
    horario = models.ForeignKey(
        HorarioTimetable,
        on_delete=models.PROTECT,
        help_text="O período/horário de início da aula"
    )
    disciplina = models.CharField(
        max_length=150,
        null=False,
        blank=False,
        help_text="Nome da disciplina (vindo do EduPage)"
    )
    professor = models.CharField(
        max_length=150,
        null=True,
        blank=True,
        help_text="Nome do(s) professor(es) (opcional)"
    )
    turma = models.CharField(
        max_length=100,
        null=False,
        blank=False,
        help_text="Identificação da turma"
    )
    dia_semana = models.CharField(
        max_length=20,
        choices=DiaSemana.choices,
        null=False,
        blank=False,
        help_text="Dia da semana da aula"
    )
    duracao_periodos = models.IntegerField(
        default=1,
        null=False,
        blank=False,
        help_text="Quantos períodos consecutivos essa aula ocupa"
    )
    edupage_card_id = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        help_text="ID de rastro do card original no EduPage"
    )

    def __str__(self):
        return f"{self.disciplina} ({self.turma}) - {self.area.nome}"

    def clean(self):
        
        if self.disciplina:
            self.disciplina = self.disciplina.strip()
        if self.professor:
            self.professor = self.professor.strip()
        if self.turma:
            self.turma = self.turma.strip()            
        super().clean()

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
