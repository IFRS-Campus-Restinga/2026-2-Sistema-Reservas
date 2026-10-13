from django.db import models


class TipoTermo(models.TextChoices):
    RESPONSABILIDADE = 'RESPONSABILIDADE', 'Responsabilidade'
    RETIRADA_VEICULO = 'RETIRADA_VEICULO', 'Retirada de veículo'
    DEVOLUCAO_VEICULO = 'DEVOLUCAO_VEICULO', 'Devolução de veículo'