from rest_framework import permissions

from .regras_comuns import UsuarioAutenticado, usuario_e_admin


class EscritaAdmin(UsuarioAutenticado):
    message = "Você não tem permissão para realizar esta ação."

    def tem_permissao(self, request, view):
        return request.method in permissions.SAFE_METHODS or usuario_e_admin(request.user)
