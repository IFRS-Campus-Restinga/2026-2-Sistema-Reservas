from django.db import models


class StatusRecurso(models.TextChoices):
    ATIVO = "ATIVO", "Ativo"
    MANUTENCAO = "MANUTENCAO", "Manutenção"
    INATIVO = "INATIVO", "Inativo"