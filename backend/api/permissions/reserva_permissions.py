from django.db.models import Q

from accounts.enumerations import Papel
from api.enumerations.tipo_recurso_reservavel import TipoRecursoReservavel
from api.models.membro_grupo_model import MembroGrupo
from api.models.recorrencia_model import Recorrencia
from .regras_comuns import UsuarioAutenticado, usuario_e_admin

class PodeConfirmarReserva(UsuarioAutenticado):
    message = "Apenas administradores podem confirmar reservas."

    def tem_permissao(self, request, view):
        return usuario_e_admin(request.user)

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
        primeira_reserva = (
            objeto.reservas.select_related("reservaarea", "reservarecursogeral").first()
        )
        if primeira_reserva is None:
            return False
        data_inicio = objeto.data_inicio
        data_fim = objeto.data_fim
        tipo_reserva = primeira_reserva.tipo_reserva
        recurso_especifico = getattr(primeira_reserva, "reservarecursogeral", None)
        tipo_recurso_id = (
            recurso_especifico.recurso_geral.tipo_recurso_id
            if recurso_especifico and recurso_especifico.recurso_geral_id
            else None
        )
    else:
        data_inicio = objeto.data
        data_fim = getattr(objeto, "data_devolucao_prevista", None) or objeto.data
        tipo_reserva = objeto.tipo_reserva
        tipo_recurso_id = None
        recurso_especifico = getattr(objeto, "reservarecursogeral", None)
        if recurso_especifico and recurso_especifico.recurso_geral_id:
            tipo_recurso_id = recurso_especifico.recurso_geral.tipo_recurso_id
        elif hasattr(objeto, "recurso_geral_id") and getattr(objeto, "recurso_geral", None):
            tipo_recurso_id = objeto.recurso_geral.tipo_recurso_id

    if tipo_reserva == "VEICULO":
        return False

    membros_qs = MembroGrupo.objects.filter(
        grupo__criador=user,
        grupo__tipo_membro_permitido=Papel.ALUNO,
        usuario=dono,
        grupo__data_inicio_validade__lte=data_inicio,
    ).filter(
        Q(grupo__data_fim_validade__isnull=True) | Q(grupo__data_fim_validade__gte=data_fim)
    ).filter(
        Q(data_fim_validade__isnull=True) | Q(data_fim_validade__gte=data_fim)
    )

    if tipo_reserva == "AREA":
        membros_qs = membros_qs.filter(
            grupo__autorizacoes__tipo_recurso_autorizado=TipoRecursoReservavel.AREA
        )
    elif tipo_reserva == "RECURSO_GERAL":
        membros_qs = membros_qs.filter(
            grupo__autorizacoes__tipo_recurso_autorizado=TipoRecursoReservavel.RECURSO_GERAL
        )
        if tipo_recurso_id:
            membros_qs = membros_qs.filter(
                Q(grupo__autorizacoes__tipo_recurso__isnull=True)
                | Q(grupo__autorizacoes__tipo_recurso_id=tipo_recurso_id)
            )

    return membros_qs.exists()

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

