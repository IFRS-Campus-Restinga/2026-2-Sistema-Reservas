from django.db import models
from api.models.base_model import BaseModel

class HorarioTimetable(BaseModel):
    """
    Tabela de mapeamento dos períodos do EduPage.
    Como os horários vêm null no JSON, essa tabela cruza o ID numérico
    (1 a 15) com as horas reais (ex: 07:30 às 08:20).
    """

    class Meta:
        db_table = 'horario_timetable'
        verbose_name = 'Horário Timetable'
        verbose_name_plural = 'Horários Timetable'

    edupage_id = models.IntegerField(
        null=False,
        blank=False,
        unique=True,
        help_text="ID do período retornado pelo JSON do EduPage (ex: 1 a 15)"
    )
    horario_inicio = models.TimeField(
        null=False,
        blank=False,
        help_text="Hora real de início da aula"
    )
    horario_fim = models.TimeField(
        null=False,
        blank=False,
        help_text="Hora real de término da aula"
    )
    def __str__(self):
        inicio = self.horario_inicio.strftime('%H:%M') if self.horario_inicio else ''
        fim = self.horario_fim.strftime('%H:%M') if self.horario_fim else ''
        return f"Período {self.edupage_id} ({inicio} às {fim})"
