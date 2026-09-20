from django.db import models


class TipoRecursoReservavel(models.TextChoices):
    ESPACO = "ESPACO", "Espaço"
    VEICULO = "VEICULO", "Veículo"
    RECURSO_GERAL = "RECURSO_GERAL", "Recurso Geral"
