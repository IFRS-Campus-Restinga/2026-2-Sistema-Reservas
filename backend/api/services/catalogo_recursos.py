from django.db.models import Case, CharField, F, Q, Value, When
from django.db.models.functions import Lower, Replace


def categorias_catalogo(queryset):
    """Mantém a classificação usada pelo front para cadastros antigos."""
    descricao = Lower('descricao')
    for acento, letra in zip('áàâãéêíóôõúç', 'aaaaeeiooouc'):
        descricao = Replace(descricao, Value(acento), Value(letra))
    queryset = queryset.annotate(descricao_normalizada=descricao)
    audiovisual = Q(descricao_normalizada__in=[
        'projetores', 'caixas de som', 'microfones', 'cameras fotograficas', 'suportes para projetor',
    ])
    return queryset.annotate(categoria_catalogo=Case(
        When(Q(categoria='TECNOLOGIA') & audiovisual, then=Value('AUDIOVISUAL')),
        When(categoria='TECNOLOGIA', then=Value('INFORMATICA')),
        When(categoria='ESPORTES', then=Value('MATERIAL_ESPORTIVO')),
        When(categoria='MANUTENCAO', then=Value('FERRAMENTAS')),
        When(categoria='APOIO', then=Value('MATERIAL_APOIO')),
        default=F('categoria'), output_field=CharField(),
    ))
