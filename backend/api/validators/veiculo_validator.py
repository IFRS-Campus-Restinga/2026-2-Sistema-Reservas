import re

from django.core.exceptions import ValidationError


def validar_placa(valor):
    placa = valor.upper()

    placa_antiga = r"^[A-Z]{3}[0-9]{4}$"
    placa_mercosul = r"^[A-Z]{3}[0-9][A-Z][0-9]{2}$"

    if not (
        re.match(placa_antiga, placa)
        or re.match(placa_mercosul, placa)
    ):
        raise ValidationError(
            "Informe uma placa válida."
        )