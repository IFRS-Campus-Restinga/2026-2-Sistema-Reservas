from django.db import models


class TipoNotificacao(models.TextChoices):
    CONFIRMACAO_RESERVA = "CONFIRMACAO_RESERVA", "Confirmação de reserva"
    CANCELAMENTO_RESERVA = "CANCELAMENTO_RESERVA", "Cancelamento de reserva"
    REJEICAO_RESERVA = "REJEICAO_RESERVA", "Rejeição de reserva"
