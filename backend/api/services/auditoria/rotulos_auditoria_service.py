from .registro_auditoria_service import ENTIDADE_POR_MODEL

MODEL_POR_ENTIDADE = {entidade: model for model, entidade in ENTIDADE_POR_MODEL.items()}


def rotulos_campos(entidade):
    model = MODEL_POR_ENTIDADE.get(entidade)
    if model is None:
        return {}
    return {
        campo.name: str(campo.verbose_name).capitalize()
        for campo in model._meta.concrete_fields
    }
