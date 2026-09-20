from django.shortcuts import get_object_or_404
from rest_framework import permissions

from api.models.grupo_model import Grupo
from .regras_comuns import usuario_e_admin

def usuario_e_criador_ou_admin(user, grupo):
    if usuario_e_admin(user):
        return True
    return bool(user and user.is_authenticated and grupo.criador_id == user.id)


class PodeCriarGrupo(permissions.BasePermission):
    message = "Você não tem permissão suficiente para criar este grupo."

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if usuario_e_admin(request.user):
            return True
        return getattr(request.user, 'papel', None) in getattr(view, 'papeis_permitidos', ())


class PodeGerenciarGrupo(permissions.BasePermission):
    message = "Apenas o criador do grupo ou um administrador pode realizar esta ação."

    def has_permission(self, request, view):
        if request.method != 'POST' or 'grupo_pk' not in view.kwargs:
            return True
        grupo = get_object_or_404(Grupo, pk=view.kwargs['grupo_pk'])
        return usuario_e_criador_ou_admin(request.user, grupo)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return usuario_e_criador_ou_admin(request.user, obj.grupo_relacionado)
