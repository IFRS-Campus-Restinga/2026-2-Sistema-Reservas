from django.db import models


class TipoReserva(models.TextChoices):
    INTERNA = "INTERNA", "Interna"
    EXTERNA = "EXTERNA", "Externa"
