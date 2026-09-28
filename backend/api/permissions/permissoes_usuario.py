from .grupo_permissions import tipos_grupo_que_pode_criar
from .regras_comuns import usuario_e_admin
from .regras_reserva import autorizacoes_vigentes, tipos_reserva_livre


def permissoes_do_usuario(usuario):
    return {
        'administrador': usuario_e_admin(usuario),
        'criar_grupos_de': tipos_grupo_que_pode_criar(usuario),
        'reservar_sem_grupo': list(tipos_reserva_livre(usuario)),
    }


def resumo_autorizacoes(usuario):
    return [
        {
            'grupo': membro.grupo.id,
            'grupo_nome': membro.grupo.nome,
            'tipo_recurso_autorizado': membro.grupo.tipo_recurso_autorizado,
            'tipo_recurso': membro.grupo.tipo_recurso_id,
            'valido_ate': membro.data_fim_validade or membro.grupo.data_fim_validade,
        }
        for membro in autorizacoes_vigentes(usuario)
    ]
