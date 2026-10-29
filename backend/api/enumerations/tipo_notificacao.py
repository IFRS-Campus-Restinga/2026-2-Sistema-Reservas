from django.db import models


class TipoNotificacao(models.TextChoices):
    CONFIRMACAO_RESERVA = "CONFIRMACAO_RESERVA", "Confirmação de reserva"
    CANCELAMENTO_RESERVA = "CANCELAMENTO_RESERVA", "Cancelamento de reserva"
    REJEICAO_RESERVA = "REJEICAO_RESERVA", "Rejeição de reserva"
    TERMO_ENVIADO = "TERMO_ENVIADO", "Termo enviado"
    TERMO_REENVIADO = "TERMO_REENVIADO", "Termo reenviado"
    TERMO_APROVADO = "TERMO_APROVADO", "Termo aprovado"
    TERMO_REJEITADO = "TERMO_REJEITADO", "Termo rejeitado"
