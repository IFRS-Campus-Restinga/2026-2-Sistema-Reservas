from django.core.validators import MinValueValidator
from django.db import models
from .recurso_geral_model import RecursoGeral
from .reserva_model import Reserva
from api.enumerations import StatusReserva


class ReservaRecursoGeral(Reserva):
    recurso_geral = models.ForeignKey(
        RecursoGeral,
        on_delete=models.PROTECT,
        related_name="reservas",
        verbose_name="Recurso geral",
    )

    data_devolucao_prevista = models.DateField(
        verbose_name="Data de devolução prevista"
    )

    quantidades = models.IntegerField(
        validators=[MinValueValidator(1)],
        verbose_name="Quantidade",
    )

    class Meta:
        verbose_name = "Reserva de recurso geral"
        verbose_name_plural = "Reservas de recursos gerais"

    def save(self, *args, **kwargs):
        if self._state.adding and self.recurso_geral.tem_termo_de_responsabilidade:
            self.status = StatusReserva.AGUARDANDO_TERMO
        return super().save(*args, **kwargs)
