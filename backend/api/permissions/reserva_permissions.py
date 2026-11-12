from django.db.models import Q
from rest_framework.exceptions import PermissionDenied

from accounts.enumerations import Papel
from api.enumerations.tipo_recurso_reservavel import TipoRecursoReservavel
from api.models.autorizacao_grupo_model import AutorizacaoGrupo
from api.models.membro_grupo_model import MembroGrupo
from api.models.recorrencia_model import Recorrencia
from .regras_comuns import UsuarioAutenticado, usuario_e_admin


class PodeConfirmarReserva(UsuarioAutenticado):
    message = "Apenas administradores podem confirmar reservas."

    def tem_permissao(self, request, view):
        return usuario_e_admin(request.user)


def _modalidade_e_tipo_recurso(reserva):
    if hasattr(reserva, "area_id") or getattr(reserva, "reservaarea", None) is not None:
        return TipoRecursoReservavel.AREA, None

    if hasattr(reserva, "recurso_geral_id"):
        recurso = getattr(reserva, "recurso_geral", None)
        return TipoRecursoReservavel.RECURSO_GERAL, getattr(recurso, "tipo_recurso_id", None)

    recurso_especifico = getattr(reserva, "reservarecursogeral", None)
    if recurso_especifico is not None:
        recurso = getattr(recurso_especifico, "recurso_geral", None)
        return TipoRecursoReservavel.RECURSO_GERAL, getattr(recurso, "tipo_recurso_id", None)

    if hasattr(reserva, "veiculo_id") or getattr(reserva, "reservaveiculo", None) is not None:
        return TipoRecursoReservavel.VEICULO, None

    return None, None


def _criador_possui_grupo_autorizador(
    criador, dono, modalidade, tipo_recurso_id, data_inicio, data_fim
):
    if modalidade not in (TipoRecursoReservavel.AREA, TipoRecursoReservavel.RECURSO_GERAL):
        return False

    autorizacoes_validas = AutorizacaoGrupo.objects.filter(
        tipo_recurso_autorizado=modalidade,
    )
    if modalidade == TipoRecursoReservavel.RECURSO_GERAL:
        if not tipo_recurso_id:
            return False
        autorizacoes_validas = autorizacoes_validas.filter(
            Q(tipo_recurso__isnull=True) | Q(tipo_recurso_id=tipo_recurso_id)
        )

    membros_qs = (
        MembroGrupo.objects.filter(
            grupo__criador=criador,
            grupo__excluido_em__isnull=True,
            grupo__tipo_membro_permitido=Papel.ALUNO,
            usuario=dono,
            grupo__data_inicio_validade__lte=data_inicio,
            grupo__autorizacoes__in=autorizacoes_validas,
        )
        .filter(
            Q(grupo__data_fim_validade__isnull=True)
            | Q(grupo__data_fim_validade__gte=data_fim)
        )
        .filter(
            Q(data_fim_validade__isnull=True)
            | Q(data_fim_validade__gte=data_fim)
        )
    )

    return membros_qs.exists()


def validar_autorizacao_gerenciamento_grupo(
    ator, dono, modalidade, tipo_recurso_id, data_inicio, data_fim
):
    """
    Quando a edição é feita pelo criador do grupo (não dono e não admin),
    garante que o grupo do criador também autoriza o recurso e o período de destino.
    """
    if usuario_e_admin(ator) or ator.id == dono.id:
        return

    if not _criador_possui_grupo_autorizador(
        ator, dono, modalidade, tipo_recurso_id, data_inicio, data_fim
    ):
        raise PermissionDenied(
            "Você não possui grupo vigente que autorize este recurso para o aluno no período informado."
        )


def autor_grupo_gerencia_reserva(user, objeto):
    """
    Verifica se o usuário é criador de um grupo de alunos ativo e vigente que
    autorizou a modalidade/tipo de recurso reservado pelo aluno dono da reserva.
    """
    if not (user and user.is_authenticated):
        return False

    if usuario_e_admin(user):
        return True

    dono = getattr(objeto, "usuario", None)
    if dono is None or dono.id == user.id:
        return False

    if getattr(dono, "papel", None) != Papel.ALUNO:
        return False

    if isinstance(objeto, Recorrencia):
        reservas_qs = objeto.reservas.select_related(
            "reservaarea",
            "reservarecursogeral__recurso_geral",
            "reservaveiculo",
        ).order_by("data", "horario_inicio")
        primeira_reserva = reservas_qs.first()
        if primeira_reserva is None:
            return False
        ultima_reserva = reservas_qs.last()
        data_inicio = primeira_reserva.data
        especifica_ultima = getattr(ultima_reserva, "reservarecursogeral", None)
        data_fim = (
            getattr(especifica_ultima, "data_devolucao_prevista", None)
            or ultima_reserva.data
        )
        modalidade, tipo_recurso_id = _modalidade_e_tipo_recurso(primeira_reserva)
    else:
        data_inicio = objeto.data
        especifica_recurso = getattr(objeto, "reservarecursogeral", None)
        data_fim = (
            getattr(objeto, "data_devolucao_prevista", None)
            or getattr(especifica_recurso, "data_devolucao_prevista", None)
            or objeto.data
        )
        modalidade, tipo_recurso_id = _modalidade_e_tipo_recurso(objeto)

    return _criador_possui_grupo_autorizador(
        user, dono, modalidade, tipo_recurso_id, data_inicio, data_fim
    )


def usuario_e_dono_ou_admin(user, reserva):
    return usuario_e_admin(user) or reserva.usuario_id == user.id

def usuario_pode_gerenciar_reserva(user, reserva):
    return usuario_e_dono_ou_admin(user, reserva) or autor_grupo_gerencia_reserva(user, reserva)

class PodeCancelarReserva(UsuarioAutenticado):
    message = "Apenas administradores podem cancelar reservas por esta tela."

    def tem_permissao(self, request, view):
        return usuario_e_admin(request.user)

class PodeGerenciarReserva(UsuarioAutenticado):
    message = "Apenas o responsável pela reserva, o criador do grupo autorizador ou um administrador pode realizar esta ação."

    def has_object_permission(self, request, view, obj):
        return usuario_pode_gerenciar_reserva(request.user, obj)

