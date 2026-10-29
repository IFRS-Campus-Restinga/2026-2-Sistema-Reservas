from collections import defaultdict
from datetime import datetime, time, timedelta

from django.db.models import Q, Sum
from rest_framework.exceptions import ValidationError

from api.models.area_model import Area
from api.models.recurso_geral_model import RecursoGeral
from api.models.reserva_model import Reserva
from api.models.veiculo_model import Veiculo


INICIO_OPERACAO = time(7)
FIM_OPERACAO = time(23)
HORAS_OPERACAO_DIA = 16
STATUS_DESCARTADOS = ('CANCELADA', 'REJEITADA')
MODALIDADES = ('area', 'veiculo', 'recurso_geral')


def _modalidade_e_item(reserva):
    area = getattr(reserva, 'reservaarea', None)
    if area:
        return 'area', area.area, area.area.nome, 1
    veiculo = getattr(reserva, 'reservaveiculo', None)
    if veiculo:
        return 'veiculo', veiculo.veiculo, veiculo.veiculo.nome, 1
    recurso = getattr(reserva, 'reservarecursogeral', None)
    if recurso:
        return 'recurso_geral', recurso.recurso_geral, recurso.recurso_geral.nome, recurso.quantidades
    return None, None, 'Não identificado', 1


def _fim_reserva(reserva):
    concreta = getattr(reserva, 'reservaveiculo', None) or getattr(reserva, 'reservarecursogeral', None)
    return getattr(concreta, 'data_devolucao_prevista', reserva.data)


def _horas_operacionais(reserva, periodo_inicio, periodo_fim):
    inicio = datetime.combine(reserva.data, reserva.horario_inicio)
    fim = datetime.combine(_fim_reserva(reserva), reserva.horario_fim)
    atual = max(reserva.data, periodo_inicio)
    limite = min(_fim_reserva(reserva), periodo_fim)
    total = 0
    while atual <= limite:
        janela_inicio = datetime.combine(atual, INICIO_OPERACAO)
        janela_fim = datetime.combine(atual, FIM_OPERACAO)
        total += max(0, (min(fim, janela_fim) - max(inicio, janela_inicio)).total_seconds() / 3600)
        atual += timedelta(days=1)
    return round(total, 2)


def _capacidade(modalidade, parametros, dias):
    total = 0
    if modalidade in ('todas', 'area'):
        areas = Area.objects.all()
        if parametros.get('bloco'):
            areas = areas.filter(bloco_id=parametros['bloco'])
        if parametros.get('recurso') and modalidade == 'area':
            areas = areas.filter(pk=parametros['recurso'])
        total += areas.count() * dias * HORAS_OPERACAO_DIA
    if modalidade in ('todas', 'veiculo'):
        veiculos = Veiculo.objects.all()
        if parametros.get('recurso') and modalidade == 'veiculo':
            veiculos = veiculos.filter(pk=parametros['recurso'])
        total += veiculos.count() * dias * HORAS_OPERACAO_DIA
    if modalidade in ('todas', 'recurso_geral'):
        recursos = RecursoGeral.objects.all()
        if parametros.get('tipo_recurso'):
            recursos = recursos.filter(tipo_recurso_id=parametros['tipo_recurso'])
        if parametros.get('recurso') and modalidade == 'recurso_geral':
            recursos = recursos.filter(pk=parametros['recurso'])
        unidades = recursos.aggregate(total=Sum('quantidade_total'))['total'] or 0
        total += unidades * dias * HORAS_OPERACAO_DIA
    return total


def gerar_relatorio(parametros, periodo_inicio, periodo_fim):
    modalidade = parametros.get('modalidade', 'todas')
    if modalidade not in (*MODALIDADES, 'todas'):
        raise ValidationError({'modalidade': 'Modalidade inválida.'})
    sobreposicao = (
        Q(reservaarea__data__range=(periodo_inicio, periodo_fim)) |
        Q(reservaveiculo__data__lte=periodo_fim, reservaveiculo__data_devolucao_prevista__gte=periodo_inicio) |
        Q(reservarecursogeral__data__lte=periodo_fim, reservarecursogeral__data_devolucao_prevista__gte=periodo_inicio)
    )
    reservas = Reserva.objects.filter(sobreposicao).select_related(
        'usuario', 'reservaarea__area__bloco', 'reservaveiculo__veiculo',
        'reservarecursogeral__recurso_geral__tipo_recurso',
    )
    if modalidade == 'area':
        reservas = reservas.filter(reservaarea__isnull=False)
    elif modalidade == 'veiculo':
        reservas = reservas.filter(reservaveiculo__isnull=False)
    elif modalidade == 'recurso_geral':
        reservas = reservas.filter(reservarecursogeral__isnull=False)
    if parametros.get('bloco'):
        reservas = reservas.filter(reservaarea__area__bloco_id=parametros['bloco'])
    if parametros.get('tipo_recurso'):
        reservas = reservas.filter(reservarecursogeral__recurso_geral__tipo_recurso_id=parametros['tipo_recurso'])
    if parametros.get('recurso'):
        campo = {'area': 'reservaarea__area_id', 'veiculo': 'reservaveiculo__veiculo_id',
                 'recurso_geral': 'reservarecursogeral__recurso_geral_id'}.get(modalidade)
        if campo:
            reservas = reservas.filter(**{campo: parametros['recurso']})
    responsavel = parametros.get('responsavel', '').strip()
    if responsavel:
        reservas = reservas.filter(Q(usuario__nome__icontains=responsavel) | Q(usuario__email__icontains=responsavel))
    if parametros.get('status'):
        reservas = reservas.filter(status=parametros['status'])
    if parametros.get('incluir_canceladas') != 'true':
        reservas = reservas.exclude(status__in=STATUS_DESCARTADOS)

    resultados = []
    grupos = defaultdict(lambda: {'total_reservas': 0, 'total_horas': 0})
    total_horas = 0
    for reserva in reservas.order_by('data', 'horario_inicio', 'pk')[:5000]:
        tipo, item, nome_item, quantidade = _modalidade_e_item(reserva)
        horas = _horas_operacionais(reserva, periodo_inicio, periodo_fim) * quantidade
        total_horas += horas
        chave = f'{tipo}:{item.pk}'
        grupos[chave].update({'modalidade': tipo, 'recurso_id': item.pk, 'recurso': nome_item})
        grupos[chave]['total_reservas'] += 1
        grupos[chave]['total_horas'] = round(grupos[chave]['total_horas'] + horas, 2)
        resultados.append({
            'id': reserva.pk, 'modalidade': tipo, 'recurso': nome_item,
            'responsavel': reserva.usuario.nome or reserva.usuario.email,
            'email_responsavel': reserva.usuario.email, 'data': reserva.data,
            'data_fim': _fim_reserva(reserva), 'horario_inicio': reserva.horario_inicio,
            'horario_fim': reserva.horario_fim, 'quantidade': quantidade,
            'horas_ocupadas': round(horas, 2), 'status': reserva.status,
        })
    dias = (periodo_fim - periodo_inicio).days + 1
    capacidade = _capacidade(modalidade, parametros, dias)
    return {
        'resumo': {
            'total_reservas': len(resultados), 'total_horas': round(total_horas, 2),
            'horas_disponiveis': round(capacidade, 2),
            'taxa_ocupacao': round(total_horas / capacidade * 100, 2) if capacidade else 0,
        },
        'formula_ocupacao': ('Taxa de ocupação = horas reservadas ÷ horas disponíveis dos recursos no período. '
                             'O resultado é multiplicado por 100 somente para ser apresentado como porcentagem. '
                             'O horário operacional considerado é das 07:00 às 23:00.'),
        'agrupamentos': sorted(grupos.values(), key=lambda grupo: (-grupo['total_horas'], grupo['recurso'])),
        'resultados': resultados,
    }
