from django.db import models


class TipoRecursoReservavel(models.TextChoices):
    AREA = "AREA", "Área"
    VEICULO = "VEICULO", "Veículo"
    RECURSO_GERAL = "RECURSO_GERAL", "Recurso Geral"
