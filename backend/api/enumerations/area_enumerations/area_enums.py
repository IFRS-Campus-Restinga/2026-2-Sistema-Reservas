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
    SALA = 'SALA', 'Sala'


class StatusRecurso(models.TextChoices):
    """
    Define o estado operacional de uma Área ou recurso.
    """
    ATIVO = 'ATIVO', 'Ativo'
    MANUTENCAO = 'MANUTENCAO', 'Manutenção'
    INATIVO = 'INATIVO', 'Inativo'