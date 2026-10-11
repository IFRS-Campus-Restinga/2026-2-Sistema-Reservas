from django.db import models


class TipoRecorrencia(models.TextChoices):
    DIARIA = "DIARIA", "Diária"
    SEMANAL = "SEMANAL", "Semanal"
    QUINZENAL = "QUINZENAL", "Quinzenal"
    MENSAL = "MENSAL", "Mensal"
