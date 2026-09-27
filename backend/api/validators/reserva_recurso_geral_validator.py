from datetime import datetime
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from api.enumerations.status_recurso import StatusRecurso
from api.enumerations.status_reserva import StatusReserva
from api.models.reserva_recurso_geral_model import ReservaRecursoGeral


STATUS_RESERVAS_ATIVAS = [
    StatusReserva.PENDENTE,
    StatusReserva.CONFIRMADA,
    StatusReserva.AGUARDANDO_TERMO,
]


def ocupacao_maxima(recurso, inicio=None, fim=None, excluir_reserva=None):
    reservas = ReservaRecursoGeral.objects.filter(
        recurso_geral=recurso, status__in=STATUS_RESERVAS_ATIVAS
    )
    if excluir_reserva is not None:
        reservas = reservas.exclude(pk=excluir_reserva)
    if inicio is not None and fim is not None:
        reservas = reservas.filter(
            Q(data__lt=fim.date()) |
            Q(data=fim.date(), horario_inicio__lt=fim.time())
        ).filter(
            Q(data_devolucao_prevista__gt=inicio.date()) |
            Q(data_devolucao_prevista=inicio.date(), horario_fim__gt=inicio.time())
        )

    eventos = []
    for reserva in reservas:
        retirada = datetime.combine(reserva.data, reserva.horario_inicio)
        devolucao = datetime.combine(
            reserva.data_devolucao_prevista, reserva.horario_fim
        )
        if inicio is not None:
            retirada = max(retirada, inicio)
        if fim is not None:
            devolucao = min(devolucao, fim)
        if retirada >= devolucao:
            continue
        eventos.append((retirada, reserva.quantidades))
        eventos.append((devolucao, -reserva.quantidades))

    em_uso = 0
    maior_ocupacao = 0
    for _, variacao in sorted(eventos, key=lambda item: (item[0], item[1])):
        em_uso += variacao
        maior_ocupacao = max(maior_ocupacao, em_uso)
    return maior_ocupacao


def quantidade_disponivel(dados, excluir_reserva=None):
    inicio = datetime.combine(dados['data'], dados['horario_inicio'])
    fim = datetime.combine(
        dados['data_devolucao_prevista'], dados['horario_fim']
    )
    recurso = dados['recurso_geral']
    return max(
        0,
        recurso.quantidade_total - ocupacao_maxima(
            recurso, inicio, fim, excluir_reserva
        ),
    )

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


    if quantidade > quantidade_disponivel(dados, excluir_reserva):
        raise ValidationError({
            "quantidades": "Não há quantidade suficiente disponível para esse recurso."
        })
