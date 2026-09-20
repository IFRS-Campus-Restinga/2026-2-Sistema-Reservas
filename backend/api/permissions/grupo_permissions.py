from django.shortcuts import get_object_or_404
from rest_framework import permissions

from accounts.enumerations import Papel
from api.models.grupo_model import Grupo
from .regras_comuns import usuario_e_admin

def usuario_e_criador_ou_admin(user, grupo):
    if usuario_e_admin(user):
        return True
    return bool(user and user.is_authenticated and grupo.criador_id == user.id)


PAPEIS_QUE_PODEM_CRIAR_POR_TIPO_MEMBRO = {
    Papel.SERVIDOR: (Papel.ADMIN,),
    Papel.ALUNO: (Papel.ADMIN, Papel.SERVIDOR),
}


class PodeCriarGrupo(permissions.BasePermission):
    message = "Você não tem permissão suficiente para criar este grupo."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        if usuario_e_admin(request.user):
            return True
        tipo_membro_permitido = request.data.get('tipo_membro_permitido')
        papeis_permitidos = PAPEIS_QUE_PODEM_CRIAR_POR_TIPO_MEMBRO.get(tipo_membro_permitido, ())
        return getattr(request.user, 'papel', None) in papeis_permitidos


class PodeGerenciarGrupo(permissions.BasePermission):
    message = "Apenas o criador do grupo ou um administrador pode realizar esta ação."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        return usuario_e_criador_ou_admin(request.user, obj.grupo_relacionado)


class PodeGerenciarMembrosGrupo(permissions.BasePermission):
    message = "Apenas o criador do grupo ou um administrador pode gerenciar os membros deste grupo."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        grupo_pk = view.kwargs.get('grupo_pk')
        if grupo_pk is None:
            return True
        grupo = get_object_or_404(Grupo, pk=grupo_pk)
        return usuario_e_criador_ou_admin(request.user, grupo)

    def has_object_permission(self, request, view, obj):
        return usuario_e_criador_ou_admin(request.user, obj.grupo_relacionado)
