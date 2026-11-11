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
    RECORRENCIA_RESERVA_AREA = "RECORRENCIA_RESERVA_AREA", "Recorrência de reserva de área"
    RECORRENCIA_RESERVA_VEICULO = "RECORRENCIA_RESERVA_VEICULO", "Recorrência de reserva de veículo"
    RECORRENCIA_RESERVA_RECURSO = "RECORRENCIA_RESERVA_RECURSO", "Recorrência de reserva de recurso geral"
    GRUPO = "GRUPO", "Grupo"
    MEMBRO_GRUPO = "MEMBRO_GRUPO", "Membro de grupo"
    RECURSO_GERAL = "RECURSO_GERAL", "Recurso geral"
    TIPO_RECURSO = "TIPO_RECURSO", "Tipo de recurso"
    CATEGORIA_RECURSO = "CATEGORIA_RECURSO", "Categoria de recurso"
    AREA = "AREA", "Área"
    BLOCO = "BLOCO", "Bloco"
    VEICULO = "VEICULO", "Veículo"
    TIMETABLE = "TIMETABLE", "Timetable"
