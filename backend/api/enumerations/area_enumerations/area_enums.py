from django.db import models


class TipoArea(models.TextChoices):
    """
    Define os tipos possíveis para uma Área.
    """
    CONVENCIONAL = 'CONVENCIONAL', 'Convencional'
    LABORATORIO = 'LABORATORIO', 'Laboratório'
    INFORMATICA = 'INFORMATICA', 'Informática'
    MUSICA = 'MUSICA', 'Música'
    AUDITORIO = 'AUDITORIO', 'Auditório'
    QUADRA = 'QUADRA', 'Quadra'
    CHURRASQUEIRA = 'CHURRASQUEIRA', 'Churrasqueira'


class EquipamentoArea(models.TextChoices):
    """
    Define a lista de equipamentos disponíveis em uma Área.
    """
    PROJETOR = 'PROJETOR', 'Projetor'
    AR_CONDICIONADO = 'AR_CONDICIONADO', 'Ar Condicionado'
    QUADRO_BRANCO = 'QUADRO_BRANCO', 'Quadro Branco'
    COMPUTADOR = 'COMPUTADOR', 'Computador'
    SISTEMA_DE_SOM = 'SISTEMA_DE_SOM', 'Sistema de Som'
    TV = 'TV', 'TV'


class StatusRecurso(models.TextChoices):
    """
    Define o estado operacional de uma Área ou recurso.
    """
    ATIVO = 'ATIVO', 'Ativo'
    MANUTENCAO = 'MANUTENCAO', 'Manutenção'
    INATIVO = 'INATIVO', 'Inativo'