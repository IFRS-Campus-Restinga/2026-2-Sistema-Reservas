from calendar import monthrange
from datetime import date, datetime, time, timedelta

from django.db.models import Q
from django.utils import timezone

from api.enumerations import StatusRecurso
from api.enumerations.tipo_recurso_reservavel import TipoRecursoReservavel
from api.models.area_model import Area
from api.models.recurso_geral_model import RecursoGeral
from api.validators.reserva_area_validator import reservas_ativas_area
from api.models.reserva_recurso_geral_model import ReservaRecursoGeral
from api.models.reserva_veiculo_model import ReservaVeiculo
from api.models.veiculo_model import Veiculo
from api.services.reserva_veiculo_service import MARGEM_ENTRE_RESERVAS, STATUS_RESERVAS_ABERTAS
from api.permissions.regras_reserva import pode_reservar
from api.validators.reserva_recurso_geral_validator import STATUS_RESERVAS_ATIVAS


INICIO_DIA = 7 * 60
FIM_DIA = 23 * 60
PASSO = 30
DURACAO_MINIMA = 30


def _minutos(horario):
    return horario.hour * 60 + horario.minute


def _horario(minutos):
    return f'{minutos // 60:02d}:{minutos % 60:02d}'


def _datas_do_mes(ano, mes):
    hoje = timezone.localdate()
    return (
        date(ano, mes, dia)
        for dia in range(1, monthrange(ano, mes)[1] + 1)
        if date(ano, mes, dia) >= hoje
    )


def _opcoes(intervalos_bloqueados, quantidade_disponivel=None):
    resultado = {}
    for data_atual, bloqueios in intervalos_bloqueados.items():
        horarios = []
        for inicio_minutos in range(INICIO_DIA, FIM_DIA - DURACAO_MINIMA + 1, PASSO):
            inicio = datetime.combine(data_atual, time(inicio_minutos // 60, inicio_minutos % 60))
            fim = inicio + timedelta(minutes=DURACAO_MINIMA)
            if inicio <= timezone.make_naive(timezone.now()):
                continue
            if quantidade_disponivel:
                disponivel = quantidade_disponivel(data_atual, inicio, fim)
            else:
                disponivel = not any(inicio < bloqueio_fim and fim > bloqueio_inicio for bloqueio_inicio, bloqueio_fim in bloqueios)
            if disponivel:
                horarios.append(_horario(inicio_minutos))
        if horarios:
            resultado[data_atual.isoformat()] = horarios
    return resultado


def opcoes_area(recurso_id, ano, mes, excluir_reserva=None, usuario=None):
    area = Area.objects.get(pk=recurso_id)
    if area.status != StatusRecurso.ATIVO or not area.disponibilidade:
        return {}
    datas = [dia for dia in _datas_do_mes(ano, mes) if usuario is None or pode_reservar(
        usuario, TipoRecursoReservavel.AREA, data=dia,
    )]
    intervalos = {dia: [] for dia in datas}
    reservas = reservas_ativas_area(area, datas, excluir_reserva)
    for reserva in reservas:
        intervalos[reserva.data].append((
            datetime.combine(reserva.data, reserva.horario_inicio),
            datetime.combine(reserva.data, reserva.horario_fim),
        ))
    return _opcoes(intervalos)


def opcoes_veiculo(recurso_id, ano, mes, excluir_reserva=None, usuario=None):
    veiculo = Veiculo.objects.get(pk=recurso_id)
    if veiculo.status != StatusRecurso.ATIVO:
        return {}
    datas = [dia for dia in _datas_do_mes(ano, mes) if usuario is None or pode_reservar(
        usuario, TipoRecursoReservavel.VEICULO, data=dia, data_fim=dia,
    )]
    intervalos = {dia: [] for dia in datas}
    if not datas:
        return {}
    inicio_mes = datetime.combine(datas[0], time.min)
    fim_mes = datetime.combine(datas[-1], time.max)
    reservas = ReservaVeiculo.objects.filter(veiculo=veiculo, status__in=STATUS_RESERVAS_ABERTAS).filter(
        Q(data__lte=datas[-1]) & Q(data_devolucao_prevista__gte=datas[0])
    )
    if excluir_reserva:
        reservas = reservas.exclude(pk=excluir_reserva)
    bloqueios = [(
        max(datetime.combine(r.data, r.horario_inicio) - MARGEM_ENTRE_RESERVAS, inicio_mes),
        min(datetime.combine(r.data_devolucao_prevista, r.horario_fim) + MARGEM_ENTRE_RESERVAS, fim_mes),
    ) for r in reservas]
    for dia in datas:
        intervalos[dia] = bloqueios
    return _opcoes(intervalos)


def opcoes_recurso_geral(recurso_id, ano, mes, quantidade=1, excluir_reserva=None, usuario=None):
    recurso = RecursoGeral.objects.get(pk=recurso_id)
    if recurso.status != StatusRecurso.ATIVO or quantidade < 1 or quantidade > recurso.quantidade_total:
        return {}
    datas = [dia for dia in _datas_do_mes(ano, mes) if usuario is None or pode_reservar(
        usuario, TipoRecursoReservavel.RECURSO_GERAL, recurso.tipo_recurso_id,
        data=dia, data_fim=dia,
    )]
    intervalos = {dia: [] for dia in datas}
    if not datas:
        return {}
    reservas = ReservaRecursoGeral.objects.filter(
        recurso_geral=recurso, status__in=STATUS_RESERVAS_ATIVAS,
    ).filter(
        Q(data__lte=datas[-1]) & Q(data_devolucao_prevista__gte=datas[0])
    )
    if excluir_reserva:
        reservas = reservas.exclude(pk=excluir_reserva)
    reservas = list(reservas)

    def tem_quantidade(_dia, inicio, fim):
        eventos = []
        for reserva in reservas:
            retirada = datetime.combine(reserva.data, reserva.horario_inicio)
            devolucao = datetime.combine(reserva.data_devolucao_prevista, reserva.horario_fim)
            if retirada < fim and devolucao > inicio:
                eventos.append((max(retirada, inicio), reserva.quantidades))
                eventos.append((min(devolucao, fim), -reserva.quantidades))
        em_uso = 0
        maior = 0
        for _, variacao in sorted(eventos, key=lambda item: (item[0], item[1])):
            em_uso += variacao
            maior = max(maior, em_uso)
        return recurso.quantidade_total - maior >= quantidade

    return _opcoes(intervalos, tem_quantidade)
