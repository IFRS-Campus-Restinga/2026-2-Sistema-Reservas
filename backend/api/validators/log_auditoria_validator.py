from django.core.exceptions import ValidationError


def validar_alteracao_log_auditoria(log):
    if not log._state.adding:
        raise ValidationError("Registros de auditoria não podem ser alterados.")


def validar_exclusao_log_auditoria():
    raise ValidationError("Registros de auditoria não podem ser excluídos.")
