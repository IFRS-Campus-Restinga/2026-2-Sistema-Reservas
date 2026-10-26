from rest_framework import permissions
from accounts.enumerations import Papel
from django.db.models import Q

PAPEIS_ADMINISTRATIVOS = (Papel.ADMIN,)

def usuario_e_admin(user):
    return bool(user and (user.is_staff or getattr(user, 'papel', None) in PAPEIS_ADMINISTRATIVOS))

def filtro_usuario_admin():
    return (
        Q(is_staff=True)
        | Q(papel__in=PAPEIS_ADMINISTRATIVOS)
    )

class UsuarioAutenticado(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated) and self.tem_permissao(request, view)

    def tem_permissao(self, request, view):
        return True

class SomenteAdministrador(UsuarioAutenticado):
    message = 'Somente administradores podem acessar esta funcionalidade.'

    def tem_permissao(self, request, view):
        return usuario_e_admin(request.user)


class SomenteAdmin(UsuarioAutenticado):
    message = "Apenas administradores podem acessar esta informação."

    def tem_permissao(self, request, view):
        return usuario_e_admin(request.user)
