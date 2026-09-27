from django.shortcuts import get_object_or_404
from rest_framework import permissions

from accounts.enumerations import Papel
from api.models.grupo_model import Grupo
from .regras_comuns import UsuarioAutenticado, usuario_e_admin

def usuario_e_criador_ou_admin(user, grupo):
    return usuario_e_admin(user) or grupo.criador_id == user.id


PAPEIS_QUE_PODEM_CRIAR_POR_TIPO_MEMBRO = {
    Papel.SERVIDOR: (Papel.ADMIN,),
    Papel.ALUNO: (Papel.ADMIN, Papel.SERVIDOR),
}


def tipos_grupo_que_pode_criar(user):
    administrador = usuario_e_admin(user)
    papel = getattr(user, 'papel', None)
    return [
        tipo_membro
        for tipo_membro, papeis in PAPEIS_QUE_PODEM_CRIAR_POR_TIPO_MEMBRO.items()
        if administrador or papel in papeis
    ]


class PodeCriarGrupo(UsuarioAutenticado):
    message = "Você não tem permissão suficiente para criar este grupo."

    def tem_permissao(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        tipos_permitidos = tipos_grupo_que_pode_criar(request.user)
        tipo_membro_permitido = request.data.get('tipo_membro_permitido')
        if tipo_membro_permitido not in PAPEIS_QUE_PODEM_CRIAR_POR_TIPO_MEMBRO:
            return bool(tipos_permitidos)
        return tipo_membro_permitido in tipos_permitidos


class PodeGerenciarGrupo(UsuarioAutenticado):
    message = "Apenas o criador do grupo ou um administrador pode realizar esta ação."

    def has_object_permission(self, request, view, obj):
        return usuario_e_criador_ou_admin(request.user, obj.grupo_relacionado)


class PodeGerenciarMembrosGrupo(PodeGerenciarGrupo):
    message = "Apenas o criador do grupo ou um administrador pode gerenciar os membros deste grupo."

    def tem_permissao(self, request, view):
        grupo = get_object_or_404(Grupo, pk=view.kwargs['grupo_pk'])
        return usuario_e_criador_ou_admin(request.user, grupo)
