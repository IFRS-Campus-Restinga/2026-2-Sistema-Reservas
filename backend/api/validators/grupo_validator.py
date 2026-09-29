from django.core.exceptions import ValidationError


def validar_nome_grupo(value):
    if len(value.strip()) < 3:
        raise ValidationError("O nome do grupo deve ter pelo menos 3 caracteres.")
