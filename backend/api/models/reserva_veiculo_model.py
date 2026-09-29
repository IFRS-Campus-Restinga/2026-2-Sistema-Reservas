from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models

from api.enumerations import StatusReserva, TipoReserva
from .reserva_model import Reserva
from .veiculo_model import Veiculo


class ReservaVeiculo(Reserva):
    
    destino = models.CharField(max_length=50, verbose_name="Destino")
    finalidade = models.CharField(max_length=255, verbose_name="Finalidade")
    quantidade_passageiros = models.IntegerField(
        validators=[MinValueValidator(1)],
        verbose_name="Quantidade de ocupantes (incluindo motorista)",
    )
    data_devolucao_prevista = models.DateField(
        verbose_name="Data de devolução prevista"
    )
    veiculo = models.ForeignKey(
            Veiculo,
            on_delete=models.PROTECT,
            related_name="reservas",
            verbose_name="Veículo",
        )
    
    class Meta:
        verbose_name = "Reserva de veículo"
        verbose_name_plural = "Reservas de veículos"

    def clean(self):
        super().clean()
        if self.veiculo_id and isinstance(self.quantidade_passageiros, int):
            veiculo = Veiculo.objects.filter(pk=self.veiculo_id).first()
            if veiculo and self.quantidade_passageiros > veiculo.capacidade:
                raise ValidationError({
                    "quantidade_passageiros": (
                        "A quantidade de ocupantes, incluindo o motorista, "
                        "não pode exceder a capacidade do veículo."
                    )
                })

    def save(self, *args, **kwargs):
        if self._state.adding:
            self.status = StatusReserva.AGUARDANDO_TERMO
            self.tipo_reserva = TipoReserva.INTERNA
        return super().save(*args, **kwargs)
