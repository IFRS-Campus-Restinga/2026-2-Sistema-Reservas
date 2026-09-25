from django.db import models

class DiaSemana(models.TextChoices):
    """
    Define os dias da semana para as Células da Timetable.
    Os valores refletem exatamente o que mapeamos do JSON do EduPage.
    """
    SEGUNDA = 'SEG', 'Segunda-feira'
    TERCA = 'TER', 'Terça-feira'
    QUARTA = 'QUA', 'Quarta-feira'
    QUINTA = 'QUI', 'Quinta-feira'
    SEXTA = 'SEX', 'Sexta-feira'
    SABADO = 'SAB', 'Sábado'
    DOMINGO = 'DOM', 'Domingo'
