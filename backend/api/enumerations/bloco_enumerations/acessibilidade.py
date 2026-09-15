from django.db import models

class Acessibilidade(models.TextChoices):
    PISO_TATIL = 'PISO_TATIL', 'Piso Tátil'
    BANHEIRO = 'BANHEIRO', 'Banheiro Adaptado'
    BEBEDOURO = 'BEBEDOURO', 'Bebedouro Adaptado'