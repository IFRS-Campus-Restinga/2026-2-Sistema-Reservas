from api.enumerations.tipo_recurso_reservavel import TipoRecursoReservavel
from api.models.autorizacao_grupo_model import AutorizacaoGrupo


def salvar_autorizacoes_grupo(grupo, tipos_recurso_autorizados, tipos_recurso):
    grupo.autorizacoes.all().delete()
    autorizacoes = []
    for tipo in TipoRecursoReservavel.values:
        if tipo not in tipos_recurso_autorizados:
            continue
        if tipo == TipoRecursoReservavel.RECURSO_GERAL:
            autorizacoes.extend(
                AutorizacaoGrupo(grupo=grupo, tipo_recurso_autorizado=tipo, tipo_recurso=tipo_recurso)
                for tipo_recurso in dict.fromkeys(tipos_recurso)
            )
        else:
            autorizacoes.append(AutorizacaoGrupo(grupo=grupo, tipo_recurso_autorizado=tipo))
    AutorizacaoGrupo.objects.bulk_create(autorizacoes)
    if hasattr(grupo, '_prefetched_objects_cache'):
        grupo._prefetched_objects_cache.pop('autorizacoes', None)
