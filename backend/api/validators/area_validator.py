from django.core.exceptions import ValidationError
from api.enumerations.area_enumerations.area_enums import EquipamentoArea


def validar_equipamentos_area(value):

    if not isinstance(value, list):
        raise ValidationError("O campo equipamento deve ser uma lista.")

    opcoes_validas = set(EquipamentoArea.values)
    for item in value:
        if item not in opcoes_validas:
            raise ValidationError(
                f"O equipamento '{item}' é inválido. Opções aceitas: {list(opcoes_validas)}"
            )