from datetime import timedelta

from django.db.models import F, Prefetch, Q
from django.utils import timezone

from accounts.enumerations import Papel
from api.enumerations.tipo_recurso_reservavel import TipoRecursoReservavel
from api.models.autorizacao_grupo_model import AutorizacaoGrupo
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
    if tipo_membro == Papel.ALUNO:
        return [TipoRecursoReservavel.AREA, TipoRecursoReservavel.RECURSO_GERAL]
    if tipo_membro != Papel.SERVIDOR:
        return []
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
        .prefetch_related(Prefetch(
            'grupo__autorizacoes',
            queryset=AutorizacaoGrupo.objects.exclude(
                Q(tipo_recurso_autorizado=TipoRecursoReservavel.VEICULO) & ~Q(grupo__tipo_membro_permitido=Papel.SERVIDOR)
            ),
        ))
    )


def pode_reservar(usuario, tipo_recurso_autorizado, tipo_recurso_id=None, data=None, data_fim=None):
    if not (usuario and usuario.is_authenticated):
        return False
    if tipo_recurso_autorizado in tipos_reserva_livre(usuario):
        return True
    if tipo_recurso_autorizado == TipoRecursoReservavel.VEICULO:
        if getattr(usuario, 'papel', None) != Papel.SERVIDOR:
            return False
    inicio = data or timezone.localdate()
    return _tem_cobertura_grupo(
        usuario, tipo_recurso_autorizado, tipo_recurso_id, inicio, data_fim or inicio,
    )


def _tem_cobertura_grupo(usuario, tipo_recurso_autorizado, tipo_recurso_id, inicio, fim):
    if fim < inicio:
        return False
    filtro_autorizacao = {'grupo__autorizacoes__tipo_recurso_autorizado': tipo_recurso_autorizado}
    if tipo_recurso_autorizado == TipoRecursoReservavel.RECURSO_GERAL:
        if tipo_recurso_id is None:
            return False
        filtro_autorizacao['grupo__autorizacoes__tipo_recurso_id'] = tipo_recurso_id
    membros = MembroGrupo.objects.filter(
        usuario=usuario,
        grupo__tipo_membro_permitido=F('usuario__papel'),
        grupo__excluido_em__isnull=True,
        grupo__data_inicio_validade__lte=fim,
        **filtro_autorizacao,
    ).select_related('grupo').order_by('grupo__data_inicio_validade')
    proximo_dia = inicio
    for membro in membros:
        grupo = membro.grupo
        limite = min(dia for dia in (grupo.data_fim_validade, membro.data_fim_validade, fim) if dia is not None)
        if limite < proximo_dia:
            continue
        if grupo.data_inicio_validade > proximo_dia:
            return False
        if limite >= fim:
            return True
        proximo_dia = limite + timedelta(days=1)
    return False

