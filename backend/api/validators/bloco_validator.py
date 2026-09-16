from django.core.exceptions import ValidationError
from api.enumerations.bloco_enumerations.acessibilidade import Acessibilidade


def validar_acessibilidade_bloco(value):

    if not isinstance(value, list):
        raise ValidationError("O campo acessibilidade deve ser uma lista.")

    opcoes_validas = set(Acessibilidade.values)
    for item in value:
        if item not in opcoes_validas:
            raise ValidationError(
                f"A opção '{item}' é inválida. Opções aceitas: {list(opcoes_validas)}"
            )