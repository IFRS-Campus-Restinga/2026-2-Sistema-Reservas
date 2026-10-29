from rest_framework import permissions
from accounts.enumerations import Papel
from django.db.models import Q

def usuario_e_admin(user):
    return bool(user and (user.is_staff or getattr(user, 'papel', None) == Papel.ADMIN))


def filtro_usuario_admin():
    return (
        Q(is_staff=True)
        | Q(papel__in=Papel.ADMIN)
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


class LeituraPublica(permissions.BasePermission):
    """Libera leitura sem login. Combine com outra regra para a escrita: LeituraPublica | EscritaAdmin."""

    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS
