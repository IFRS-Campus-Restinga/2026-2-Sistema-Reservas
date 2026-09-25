from datetime import datetime
from rest_framework.exceptions import ValidationError
from api.enumerations.status_recurso import StatusRecurso
from api.enumerations.status_reserva import StatusReserva
from api.models.reserva_recurso_geral_model import ReservaRecursoGeral


def validar_disponibilidade(dados):
    recurso = dados["recurso_geral"]
    quantidade = dados["quantidades"]

    if recurso.status != StatusRecurso.ATIVO:
        raise ValidationError({
            "recurso_geral": "O recurso não está disponível para reserva."
        })

    if quantidade > recurso.quantidade_total:
        raise ValidationError({
            "quantidades": "A quantidade solicitada ultrapassa o total do recurso."
        })

    inicio = datetime.combine(
        dados["data"],
        dados["horario_inicio"]
    )

    fim = datetime.combine(
        dados["data_devolucao_prevista"],
        dados["horario_fim"]
    )

    status_ativos = [
        StatusReserva.PENDENTE,
        StatusReserva.CONFIRMADA,
        StatusReserva.AGUARDANDO_TERMO,
    ]

    reservas = ReservaRecursoGeral.objects.filter(
        recurso_geral=recurso,
        status__in=status_ativos,
        data__lte=dados["data_devolucao_prevista"],
        data_devolucao_prevista__gte=dados["data"],
    )

    periodos = []
    instantes = {inicio}

    for reserva in reservas:
        inicio_reserva = datetime.combine(
            reserva.data,
            reserva.horario_inicio
        )

        fim_reserva = datetime.combine(
            reserva.data_devolucao_prevista,
            reserva.horario_fim
        )

        if inicio < fim_reserva and fim > inicio_reserva:
            periodos.append((
                inicio_reserva,
                fim_reserva,
                reserva.quantidades
            ))

            instantes.add(max(inicio, inicio_reserva))

    for instante in instantes:
        ocupadas = sum(
            qtd
            for inicio_reserva, fim_reserva, qtd in periodos
            if inicio_reserva <= instante < fim_reserva
        )

        if ocupadas + quantidade > recurso.quantidade_total:
            raise ValidationError({
                "quantidades": "Não há quantidade suficiente disponível nesse período."
            })
