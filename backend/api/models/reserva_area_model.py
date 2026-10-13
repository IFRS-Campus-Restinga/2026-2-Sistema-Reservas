from django.db import models
from .area_model import Area
from .reserva_model import Reserva


class ReservaArea(Reserva):
    area = models.ForeignKey(
        Area,
        on_delete=models.PROTECT,
        related_name="reservas",
        verbose_name="Área"
    )

    aula = models.BooleanField(
        default=True,
        verbose_name="É aula?",
    )

    celula_timetable = models.ForeignKey(
        "CelulaTimetable",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="reservas_area",
        verbose_name="Célula da Timetable",
    )

    class Meta:
        verbose_name = "Reserva de Área"
        verbose_name_plural = "Reservas de Área"
