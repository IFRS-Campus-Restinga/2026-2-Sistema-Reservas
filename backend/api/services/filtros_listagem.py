"""Filtros permitidos nas listagens, aplicados antes de contar/paginar."""
from django.db.models import Q
from rest_framework.exceptions import ValidationError


BUSCA = {
    'area': ('nome',),
    'bloco': ('nome',),
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
    'grupo': {'tipo_membro': 'tipo_membro_permitido', 'recurso': 'tipo_recurso_autorizado',
              'tipo_recurso': 'tipo_recurso_id'},
    'reserva': {'status': 'status'},
}
MODALIDADES = {'area': 'reservaarea', 'veiculo': 'reservaveiculo',
               'recurso_geral': 'reservarecursogeral'}


def filtrar_listagem(request, queryset):
    modelo = queryset.model._meta.model_name
    parametros = request.query_params
    if parametros.get('id'):
        try:
            queryset = queryset.filter(pk=int(parametros['id']))
        except ValueError:
            raise ValidationError({'id': 'Informe um número inteiro.'})
    termo = parametros.get('busca', '').strip()
    campos = BUSCA.get(modelo, ())
    if termo and campos:
        busca = Q()
        for campo in campos:
            busca |= Q(**{f'{campo}__icontains': termo})
        queryset = queryset.filter(busca)
    for parametro, campo in FILTROS.get(modelo, {}).items():
        if modelo == 'tiporecurso' and parametro == 'categoria' and parametros.get('catalogo') == 'true':
            campo = 'categoria_catalogo'
        valor = parametros.get(parametro)
        if valor and valor not in ('todos', 'todas'):
            if campo.endswith('_id') or campo == 'capacidade__gte':
                try:
                    valor = int(valor)
                except ValueError:
                    raise ValidationError({parametro: 'Informe um número inteiro.'})
            queryset = queryset.filter(**{campo: valor})
    if modelo == 'grupo' and parametros.get('meus') == 'true':
        queryset = queryset.filter(criador=request.user)
    if modelo == 'reserva':
        modalidade = parametros.get('modalidade')
        if modalidade in MODALIDADES:
            queryset = queryset.filter(**{f'{MODALIDADES[modalidade]}__isnull': False})
    if modelo == 'recursogeral' and parametros.get('disponiveis') == 'true':
        queryset = queryset.filter(status='ATIVO', quantidade_total__gt=0)
    if modelo == 'area' and parametros.get('disponiveis') == 'true':
        queryset = queryset.filter(status='ATIVO', disponibilidade=True)
    # O desempate evita repetição/omissão em registros com a mesma data ou nome.
    ordenacao = queryset.query.order_by or queryset.model._meta.ordering or ('pk',)
    return queryset.order_by(*ordenacao, 'pk')
