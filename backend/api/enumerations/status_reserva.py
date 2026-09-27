from django.db import models


class StatusReserva(models.TextChoices):
    PENDENTE = "PENDENTE", "Pendente"
    CONFIRMADA = "CONFIRMADA", "Confirmada"
    CANCELADA = "CANCELADA", "Cancelada"
    REJEITADA = "REJEITADA", "Rejeitada"
    AGUARDANDO_TERMO = "AGUARDANDO_TERMO", "Aguardando termo"
    CONCLUIDA = "CONCLUIDA", "Concluída"
