from django.db import models


class TipoPrazo(models.TextChoices):
    CURTO_PRAZO = "CURTO_PRAZO", "Curto prazo"
    LONGO_PRAZO = "LONGO_PRAZO", "Longo prazo"