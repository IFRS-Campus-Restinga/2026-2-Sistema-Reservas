"""Filtros permitidos nas listagens, aplicados antes de contar/paginar."""
from datetime import timedelta

from django.db.models import Q
from django.utils.dateparse import parse_date
from rest_framework.exceptions import ValidationError

from api.models.timetable import PeriodoLetivo
from api.services.timetable.reservas_timetable_service import MAPA_DIAS_SEMANA


BUSCA = {
    'area': ('nome',),
    'bloco': ('nome', 'numero'),
    'veiculo': ('nome', 'marca', 'modelo', 'placa'),
    'recursogeral': ('nome', 'codigo', 'tipo_recurso__descricao'),
    'tiporecurso': ('descricao',),
    'grupo': ('nome',),
    'membrogrupo': ('usuario__nome', 'usuario__email'),
    'reserva': ('nome', 'usuario__nome', 'usuario__email',
                'reservaarea__area__nome', 'reservaveiculo__veiculo__nome',
                'reservaveiculo__veiculo__placa',
                'reservarecursogeral__recurso_geral__nome',
                'reservarecursogeral__recurso_geral__tipo_recurso__descricao'),
}
FILTROS = {
    'area': {'bloco': 'bloco_id', 'capacidade': 'capacidade__gte', 'status': 'status'},
    'veiculo': {'status': 'status'},
    'recursogeral': {'tipo_recurso': 'tipo_recurso_id', 'status': 'status'},
    'tiporecurso': {'categoria': 'categoria'},
    'grupo': {'tipo_membro': 'tipo_membro_permitido',
              'recurso': 'autorizacoes__tipo_recurso_autorizado',
              'tipo_recurso': 'autorizacoes__tipo_recurso_id'},
    'reserva': {'status': 'status',
                'tipo_recurso': 'reservarecursogeral__recurso_geral__tipo_recurso_id'},
}
BUSCA_MINHAS_RESERVAS = tuple(campo for campo in BUSCA['reserva'] if not campo.startswith('usuario__'))
MODALIDADES = {'area': 'reservaarea', 'veiculo': 'reservaveiculo',
               'recurso_geral': 'reservarecursogeral'}


def ids_do_parametro(parametros, nome):
    valor = parametros.get(nome, '')
    if not valor or valor in ('todos', 'todas'):
        return []
    try:
        return [int(parte) for parte in valor.split(',') if parte.strip()]
    except ValueError:
        raise ValidationError({nome: 'Informe números inteiros separados por vírgula.'})


def data_do_parametro(parametros, nome):
    valor = parametros.get(nome, '').strip()
    if not valor:
        return None
    try:
        data = parse_date(valor)
    except ValueError:
        data = None
    if not data:
        raise ValidationError({nome: 'Informe uma data válida no formato AAAA-MM-DD.'})
    return data


def periodo_do_parametro(parametros):
    data_inicio = data_do_parametro(parametros, 'data_inicio')
    data_fim = data_do_parametro(parametros, 'data_fim')
    if data_inicio and data_fim and data_inicio > data_fim:
        raise ValidationError({'data_fim': 'A data final não pode ser anterior à data inicial.'})
    return data_inicio, data_fim


def _dias_da_semana(data_inicio, data_fim):
    if not data_inicio or not data_fim or (data_fim - data_inicio).days >= 6:
        return None
    dias = {(data_inicio + timedelta(days=dia)).weekday() for dia in range((data_fim - data_inicio).days + 1)}
    return [codigo for codigo, dia in MAPA_DIAS_SEMANA.items() if dia in dias]


def _intervalo(campo_inicio, campo_fim, data_inicio, data_fim, **condicoes):
    if data_fim:
        condicoes[f'{campo_inicio}__lte'] = data_fim
    if data_inicio:
        condicoes[f'{campo_fim}__gte'] = data_inicio
    return Q(**condicoes)


def _aulas_no_periodo(data_inicio, data_fim):
    if not _dias_da_semana(data_inicio, data_fim):
        periodo_letivo = 'reservaarea__celula_timetable__periodo_letivo'
        return _intervalo(f'{periodo_letivo}__data_inicio', f'{periodo_letivo}__data_fim', data_inicio, data_fim)
    aulas = Q(pk__in=[])
    for letivo in PeriodoLetivo.objects.filter(data_inicio__lte=data_fim, data_fim__gte=data_inicio):
        dias_da_semana = _dias_da_semana(max(data_inicio, letivo.data_inicio), min(data_fim, letivo.data_fim))
        aulas |= Q(reservaarea__celula_timetable__periodo_letivo=letivo,
                   reservaarea__celula_timetable__dia_semana__in=dias_da_semana)
    return aulas


def sobreposicao_periodo(data_inicio=None, data_fim=None):
    return (
        _intervalo('reservaarea__data', 'reservaarea__data', data_inicio, data_fim,
                   reservaarea__celula_timetable__isnull=True)
        | _aulas_no_periodo(data_inicio, data_fim)
        | _intervalo('reservaveiculo__data', 'reservaveiculo__data_devolucao_prevista', data_inicio, data_fim)
        | _intervalo('reservarecursogeral__data', 'reservarecursogeral__data_devolucao_prevista', data_inicio, data_fim)
    )


def filtrar_periodo_reservas(reservas, parametros):
    data_inicio, data_fim = periodo_do_parametro(parametros)
    if not data_inicio and not data_fim:
        return reservas
    return reservas.filter(sobreposicao_periodo(data_inicio, data_fim))


def filtrar_listagem(request, queryset, campos_busca=None):
    modelo = queryset.model._meta.model_name
    parametros = request.query_params
    if parametros.get('id'):
        try:
            queryset = queryset.filter(pk=int(parametros['id']))
        except ValueError:
            raise ValidationError({'id': 'Informe um número inteiro.'})
    termo = parametros.get('busca', '').strip()
    campos = campos_busca if campos_busca is not None else BUSCA.get(modelo, ())
    if termo and campos:
        busca = Q()
        for campo in campos:
            busca |= Q(**{f'{campo}__icontains': termo})
        queryset = queryset.filter(busca)
    for parametro, campo in FILTROS.get(modelo, {}).items():
        if modelo == 'tiporecurso' and parametro == 'categoria' and parametros.get('catalogo') == 'true':
            campo = 'categoria_catalogo'
        if campo.endswith('_id'):
            ids = ids_do_parametro(parametros, parametro)
            if ids:
                queryset = queryset.filter(**{f'{campo}__in': ids})
            continue
        valor = parametros.get(parametro)
        if valor and valor not in ('todos', 'todas'):
            if campo == 'capacidade__gte':
                try:
                    valor = int(valor)
                except ValueError:
                    raise ValidationError({parametro: 'Informe um número inteiro.'})
            queryset = queryset.filter(**{campo: valor})
    if modelo == 'grupo' and parametros.get('meus') == 'true':
        queryset = queryset.filter(criador=request.user)
    if modelo == 'grupo' and (parametros.get('recurso') or parametros.get('tipo_recurso')):
        queryset = queryset.distinct()
    if modelo == 'reserva':
        modalidade = parametros.get('modalidade')
        if modalidade in MODALIDADES:
            queryset = queryset.filter(**{f'{MODALIDADES[modalidade]}__isnull': False})
        queryset = filtrar_periodo_reservas(queryset, parametros)
    if modelo == 'recursogeral' and parametros.get('disponiveis') == 'true':
        queryset = queryset.filter(status='ATIVO', quantidade_total__gt=0)
    if modelo == 'area' and parametros.get('disponiveis') == 'true':
        queryset = queryset.filter(status='ATIVO', disponibilidade=True)
    # O desempate evita repetição/omissão em registros com a mesma data ou nome.
    ordenacao = queryset.query.order_by or queryset.model._meta.ordering or ('pk',)
    return queryset.order_by(*ordenacao, 'pk')
