from django.db import models

class DiaSemana(models.TextChoices):
    """
    Define os dias da semana para as Células da Timetable.
    Os valores refletem exatamente o que mapeamos do JSON do EduPage.
    """
    SEGUNDA = 'Segunda-feira', 'Segunda-feira'
    TERCA = 'Terça-feira', 'Terça-feira'
    QUARTA = 'Quarta-feira', 'Quarta-feira'
    QUINTA = 'Quinta-feira', 'Quinta-feira'
    SEXTA = 'Sexta-feira', 'Sexta-feira'
    SABADO = 'Sábado', 'Sábado'
    DOMINGO = 'Domingo', 'Domingo'
