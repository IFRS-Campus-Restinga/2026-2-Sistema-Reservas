from datetime import datetime, timedelta

from django.db.models import Q
from django.utils import timezone

from api.enumerations import StatusReserva
from api.enumerations.status_termo import StatusTermo


AGUARDANDO_CONFIRMACAO = 'AGUARDANDO_CONFIRMACAO'
AGUARDANDO_ENVIO_TERMO = 'AGUARDANDO_ENVIO_TERMO'
TERMO_EM_ANALISE = 'TERMO_EM_ANALISE'
AGUARDANDO_ENVIO_TERMO_RETIRADA = 'AGUARDANDO_ENVIO_TERMO_RETIRADA'

SITUACOES = {
    AGUARDANDO_CONFIRMACAO,
    AGUARDANDO_ENVIO_TERMO,
    TERMO_EM_ANALISE,
    AGUARDANDO_ENVIO_TERMO_RETIRADA,
    StatusReserva.CONFIRMADA,
    StatusReserva.AGUARDANDO_TERMO_DEVOLUCAO,
    StatusReserva.CONCLUIDA,
    StatusReserva.CANCELADA,
    StatusReserva.REJEITADA,
}


def _tem_termo_pendente(reserva):
    termos_atuais = getattr(reserva, 'termos_atuais', None)
    if termos_atuais is not None:
        return any(termo.status == StatusTermo.PENDENTE for termo in termos_atuais)
    return reserva.termos.filter(atual=True, status=StatusTermo.PENDENTE).exists()


def situacao_reserva(reserva):
    if _tem_termo_pendente(reserva):
        return TERMO_EM_ANALISE
    if getattr(reserva, 'reservarecursogeral', None) is not None and reserva.status == StatusReserva.AGUARDANDO_TERMO:
        return AGUARDANDO_ENVIO_TERMO
    if (
        getattr(reserva, 'reservaveiculo', None) is not None
        and reserva.status == StatusReserva.CONFIRMADA
        and reserva.reservaveiculo.data_devolucao_prevista >= timezone.localdate()
    ):
        inicio = timezone.make_aware(
            datetime.combine(reserva.data, reserva.horario_inicio),
            timezone.get_current_timezone(),
        )
        if timezone.now() >= inicio - timedelta(hours=1):
            return AGUARDANDO_ENVIO_TERMO_RETIRADA
    if reserva.status == StatusReserva.PENDENTE:
        return AGUARDANDO_CONFIRMACAO
    return reserva.status


def filtro_situacao(valor):
    valor = str(valor or '').upper()
    if valor == AGUARDANDO_CONFIRMACAO:
        return Q(status=StatusReserva.PENDENTE) & ~Q(
            termos__atual=True, termos__status=StatusTermo.PENDENTE,
        )
    if valor == AGUARDANDO_ENVIO_TERMO:
        return (
            Q(reservarecursogeral__isnull=False, status=StatusReserva.AGUARDANDO_TERMO)
            & ~Q(termos__atual=True, termos__status=StatusTermo.PENDENTE)
        )
    if valor == TERMO_EM_ANALISE:
        return Q(termos__atual=True, termos__status=StatusTermo.PENDENTE)
    if valor == AGUARDANDO_ENVIO_TERMO_RETIRADA:
        limite = timezone.localtime() + timedelta(hours=1)
        iniciou_ou_inicia_em_uma_hora = (
            Q(data__lt=limite.date())
            | Q(data=limite.date(), horario_inicio__lte=limite.time().replace(tzinfo=None))
        )
        return (
            Q(
                reservaveiculo__isnull=False,
                reservaveiculo__data_devolucao_prevista__gte=timezone.localdate(),
                status=StatusReserva.CONFIRMADA,
            )
            & iniciou_ou_inicia_em_uma_hora
            & ~Q(termos__atual=True, termos__status=StatusTermo.PENDENTE)
        )
    if valor in SITUACOES:
        return Q(status=valor)
    return None
