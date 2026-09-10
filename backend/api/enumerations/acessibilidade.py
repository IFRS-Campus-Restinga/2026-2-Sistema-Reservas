from django.db import models

class Acessibilidade(models.TextChoices):
    PISO_TATIL = 'PISO_TATIL', 'Piso Tátil'
    PORTAS_LARGAS = 'PORTAS_LARGAS', 'Portas Largas'
    RAMPAS = 'RAMPAS', 'Rampas'
    BANHEIRO_ADAPTADO = 'BANHEIRO_ADAPTADO', 'Banheiro Adaptado'
    ELEVADOR = 'ELEVADOR', 'Elevador'