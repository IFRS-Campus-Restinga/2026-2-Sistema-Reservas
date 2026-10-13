from django.db import models


class StatusTermo(models.TextChoices):
    PENDENTE = 'PENDENTE', 'Pendente'
    APROVADO = 'APROVADO', 'Aprovado'
    REJEITADO = 'REJEITADO', 'Rejeitado'
