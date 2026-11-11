from django.core.exceptions import ValidationError

# Não é mais usado pelo model (equipamentos viraram tabela, migration 0030), mas precisa
# continuar existindo porque a migration 0001_initial importa esta função.
EQUIPAMENTOS_ANTIGOS = {'PROJETOR', 'AR_CONDICIONADO', 'QUADRO_BRANCO', 'COMPUTADOR', 'SISTEMA_DE_SOM', 'TV'}


def validar_equipamentos_area(value):

    if not isinstance(value, list):
        raise ValidationError("O campo equipamento deve ser uma lista.")

    opcoes_validas = EQUIPAMENTOS_ANTIGOS
    for item in value:
        if item not in opcoes_validas:
            raise ValidationError(
                f"O equipamento '{item}' é inválido. Opções aceitas: {list(opcoes_validas)}"
            )