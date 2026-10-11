from api.enumerations.auditoria_enumerations import EntidadeAuditoria
from api.models.area_model import Area
from api.models.bloco_model import Bloco
from api.models.grupo_model import Grupo
from api.models.log_auditoria_model import LogAuditoria
from api.models.membro_grupo_model import MembroGrupo
from api.models.recurso_geral_model import RecursoGeral
from api.models.reserva_area_model import ReservaArea
from api.models.reserva_model import Reserva
from api.models.reserva_recurso_geral_model import ReservaRecursoGeral
from api.models.reserva_veiculo_model import ReservaVeiculo
from api.models.tipo_recurso_model import TipoRecurso
from api.models.veiculo_model import Veiculo
from api.permissions.regras_comuns import usuario_e_admin

ENTIDADE_POR_MODEL = {
    ReservaArea: EntidadeAuditoria.RESERVA_AREA,
    ReservaVeiculo: EntidadeAuditoria.RESERVA_VEICULO,
    ReservaRecursoGeral: EntidadeAuditoria.RESERVA_RECURSO_GERAL,
    Grupo: EntidadeAuditoria.GRUPO,
    MembroGrupo: EntidadeAuditoria.MEMBRO_GRUPO,
    RecursoGeral: EntidadeAuditoria.RECURSO_GERAL,
    TipoRecurso: EntidadeAuditoria.TIPO_RECURSO,
    Area: EntidadeAuditoria.AREA,
    Bloco: EntidadeAuditoria.BLOCO,
    Veiculo: EntidadeAuditoria.VEICULO,
}


def _dono(objeto):
    if isinstance(objeto, Reserva):
        return objeto.usuario
    if isinstance(objeto, Grupo):
        return objeto.criador
    if isinstance(objeto, MembroGrupo):
        return objeto.grupo.criador
    return None


def _usuario_afetado(objeto):
    if isinstance(objeto, MembroGrupo):
        return objeto.usuario
    return _dono(objeto)


def registrar_auditoria(ator, acao, objeto=None, *, antes=None, depois=None, entidade=None, descricao=None):
    if not usuario_e_admin(ator):
        return None
    dono = _dono(objeto)
    if dono is not None and dono.pk == ator.pk:
        return None
    return LogAuditoria.objects.create(
        admin=ator,
        acao=acao,
        entidade=entidade or ENTIDADE_POR_MODEL[type(objeto)],
        objeto_id=getattr(objeto, 'pk', None),
        descricao=(descricao or str(objeto))[:255],
        usuario_afetado=_usuario_afetado(objeto),
        dados_antes=antes,
        dados_depois=depois,
    )
