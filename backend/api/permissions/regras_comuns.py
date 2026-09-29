from rest_framework import permissions

from accounts.enumerations import Papel


def usuario_e_admin(user):
    return bool(user and (user.is_staff or getattr(user, 'papel', None) == Papel.ADMIN))


class UsuarioAutenticado(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated) and self.tem_permissao(request, view)

    def tem_permissao(self, request, view):
        return True
