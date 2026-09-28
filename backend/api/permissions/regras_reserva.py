from django.db.models import F, Q
from django.utils import timezone

from accounts.enumerations import Papel
from api.enumerations.tipo_recurso_reservavel import TipoRecursoReservavel
from api.models.membro_grupo_model import MembroGrupo
from .regras_comuns import usuario_e_admin

TIPOS_RESERVA_LIVRE_POR_PAPEL = {
    Papel.SERVIDOR: (TipoRecursoReservavel.AREA, TipoRecursoReservavel.RECURSO_GERAL),
}


def tipos_reserva_livre(usuario):
    if usuario_e_admin(usuario):
        return tuple(TipoRecursoReservavel.values)
    return TIPOS_RESERVA_LIVRE_POR_PAPEL.get(getattr(usuario, 'papel', None), ())


def tipos_autorizaveis_por_grupo(tipo_membro):
    livres = TIPOS_RESERVA_LIVRE_POR_PAPEL.get(tipo_membro, ())
    return [tipo for tipo in TipoRecursoReservavel.values if tipo not in livres]


def autorizacoes_vigentes(usuario, data=None):
    data = data or timezone.localdate()
    return (
        MembroGrupo.objects
        .filter(usuario=usuario, grupo__data_inicio_validade__lte=data)
        .filter(usuario__papel=F('grupo__tipo_membro_permitido'))
        .filter(Q(grupo__data_fim_validade__isnull=True) | Q(grupo__data_fim_validade__gte=data))
        .filter(Q(data_fim_validade__isnull=True) | Q(data_fim_validade__gte=data))
        .select_related('grupo')
    )


def pode_reservar(usuario, tipo_recurso_autorizado, tipo_recurso_id=None, data=None, data_fim=None):
    if not (usuario and usuario.is_authenticated):
        return False
    if tipo_recurso_autorizado in tipos_reserva_livre(usuario):
        return True
    return all(
        _tem_autorizacao(usuario, tipo_recurso_autorizado, tipo_recurso_id, dia)
        for dia in {data, data_fim or data}
    )


def _tem_autorizacao(usuario, tipo_recurso_autorizado, tipo_recurso_id, data):
    autorizacoes = autorizacoes_vigentes(usuario, data).filter(grupo__tipo_recurso_autorizado=tipo_recurso_autorizado)
    if tipo_recurso_autorizado == TipoRecursoReservavel.RECURSO_GERAL:
        autorizacoes = autorizacoes.filter(grupo__tipo_recurso_id=tipo_recurso_id)
    return autorizacoes.exists()

