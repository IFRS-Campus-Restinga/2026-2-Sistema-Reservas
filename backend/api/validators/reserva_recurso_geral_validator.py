from rest_framework.exceptions import ValidationError
from api.enumerations.status_recurso import StatusRecurso
from api.enumerations.status_reserva import StatusReserva
from api.models.reserva_recurso_geral_model import ReservaRecursoGeral


STATUS_RESERVAS_ATIVAS = [
    StatusReserva.PENDENTE,
    StatusReserva.CONFIRMADA,
    StatusReserva.AGUARDANDO_TERMO,
]


def validar_disponibilidade(dados, excluir_reserva=None):
    recurso = dados["recurso_geral"]
    quantidade = dados["quantidades"]

    if recurso.status != StatusRecurso.ATIVO:
        raise ValidationError({
            "recurso_geral": "O recurso não está disponível para reserva."
        })

    if quantidade < 1:
        raise ValidationError({
            "quantidades": "A quantidade deve ser maior que zero."
        })

    disponiveis = recurso.quantidade_total - recurso.quantidade_reservada

    if excluir_reserva is not None:
        reserva_atual = ReservaRecursoGeral.objects.get(pk=excluir_reserva)

        if (
            reserva_atual.recurso_geral_id == recurso.pk
            and reserva_atual.status in STATUS_RESERVAS_ATIVAS
        ):
            disponiveis += reserva_atual.quantidades

    if quantidade > disponiveis:
        raise ValidationError({
            "quantidades": "Não há quantidade suficiente disponível para esse recurso."
        })
