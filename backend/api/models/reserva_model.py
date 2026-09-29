from datetime import time, datetime
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
        data_fim = getattr(self, "data_devolucao_prevista", None) or self.data
        if not self.data or not data_fim:
            return
        retirada = datetime.combine(self.data, self.horario_inicio)
        devolucao = datetime.combine(data_fim, self.horario_fim)
        if devolucao <= retirada:
            raise ValidationError({
                "horario_fim": "A devolução deve ser posterior à retirada."
            })
        self.duracao = devolucao - retirada

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
