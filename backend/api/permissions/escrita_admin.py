from rest_framework import permissions

from .regras_comuns import usuario_e_admin


class EscritaAdmin(permissions.BasePermission):
    message = "Você não tem permissão para realizar esta ação."

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return usuario_e_admin(request.user)
