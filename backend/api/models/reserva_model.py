from datetime import time, timedelta

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxLengthValidator, MinLengthValidator
from django.db import models

from api.enumerations import StatusReserva, TipoReserva
from .base_model import BaseModel


class Reserva(BaseModel):
    nome = models.CharField(max_length=50, validators=[MinLengthValidator(5)], verbose_name="Nome")
    descricao = models.TextField(max_length=255, validators=[MaxLengthValidator(255)],null=True, blank=True,verbose_name="Descrição",)
    status = models.CharField(choices=StatusReserva.choices,default=StatusReserva.PENDENTE,verbose_name="Status",)
    data = models.DateField(verbose_name="Data")
    horario_inicio = models.TimeField(verbose_name="Horário de início")
    horario_fim = models.TimeField(verbose_name="Horário de fim")
    duracao = models.DurationField(blank=True, editable=False, verbose_name="Duração")
    tipo_reserva = models.CharField(choices=TipoReserva.choices, verbose_name="Tipo de reserva")
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="reservas",
        verbose_name="Usuário criador",
    )

    class Meta:
        verbose_name = "Reserva"
        verbose_name_plural = "Reservas"

    def __str__(self):
        return self.nome

    def clean(self):
        super().clean()
        if not isinstance(self.horario_inicio, time):
            return
        if not isinstance(self.horario_fim, time):
            return

        if self.horario_fim <= self.horario_inicio:
            raise ValidationError({
                "horario_fim": "O horário de fim deve ser posterior ao horário de início."
            })
        inicio = timedelta(
            hours=self.horario_inicio.hour,
            minutes=self.horario_inicio.minute,
            seconds=self.horario_inicio.second,
            microseconds=self.horario_inicio.microsecond,
        )
        fim = timedelta(
            hours=self.horario_fim.hour,
            minutes=self.horario_fim.minute,
            seconds=self.horario_fim.second,
            microseconds=self.horario_fim.microsecond,
        )
        self.duracao = fim - inicio

    def save(self, *args, **kwargs):
        campos_para_salvar = kwargs.get("update_fields")
        if campos_para_salvar is not None:
            campos_para_salvar = set(campos_para_salvar)
            if not campos_para_salvar:
                return
            atualizar_inicio = "horario_inicio" in campos_para_salvar
            atualizar_fim = "horario_fim" in campos_para_salvar
            if self.pk and (not atualizar_inicio or not atualizar_fim):
                reserva_salva = type(self).objects.get(pk=self.pk)
                if not atualizar_inicio:
                    self.horario_inicio = reserva_salva.horario_inicio
                if not atualizar_fim:
                    self.horario_fim = reserva_salva.horario_fim

            campos_para_salvar.add("duracao")
            kwargs["update_fields"] = campos_para_salvar

        self.full_clean()
        return super().save(*args, **kwargs)
