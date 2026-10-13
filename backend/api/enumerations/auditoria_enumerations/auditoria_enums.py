from django.db import models


class AcaoAuditoria(models.TextChoices):
    CRIAR = "CRIAR", "Criar"
    EDITAR = "EDITAR", "Editar"
    EXCLUIR = "EXCLUIR", "Excluir"
    CANCELAR = "CANCELAR", "Cancelar"
    SINCRONIZAR = "SINCRONIZAR", "Sincronizar"


class EntidadeAuditoria(models.TextChoices):
    RESERVA_AREA = "RESERVA_AREA", "Reserva de área"
    RESERVA_VEICULO = "RESERVA_VEICULO", "Reserva de veículo"
    RESERVA_RECURSO_GERAL = "RESERVA_RECURSO_GERAL", "Reserva de recurso geral"
    GRUPO = "GRUPO", "Grupo"
    MEMBRO_GRUPO = "MEMBRO_GRUPO", "Membro de grupo"
    RECURSO_GERAL = "RECURSO_GERAL", "Recurso geral"
    TIPO_RECURSO = "TIPO_RECURSO", "Tipo de recurso"
    AREA = "AREA", "Área"
    BLOCO = "BLOCO", "Bloco"
    VEICULO = "VEICULO", "Veículo"
    TIMETABLE = "TIMETABLE", "Timetable"
