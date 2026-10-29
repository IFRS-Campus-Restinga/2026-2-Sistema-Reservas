from api.enumerations.auditoria_enumerations import EntidadeAuditoria
from api.models.reserva_area_model import ReservaArea
from .registro_auditoria_service import ENTIDADE_POR_MODEL

MODEL_POR_ENTIDADE = {entidade: model for model, entidade in ENTIDADE_POR_MODEL.items()}

MODEL_POR_ENTIDADE[EntidadeAuditoria.RECORRENCIA_RESERVA_AREA] = ReservaArea


def rotulos_campos(entidade):
    model = MODEL_POR_ENTIDADE.get(entidade)
    if model is None:
        return {}
    return {
        campo.name: str(campo.verbose_name).capitalize()
        for campo in model._meta.concrete_fields
    }
