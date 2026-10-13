from .regras_comuns import UsuarioAutenticado, usuario_e_admin


class SomenteAdmin(UsuarioAutenticado):
    message = "Apenas administradores podem acessar este recurso."

    def tem_permissao(self, request, view):
        return usuario_e_admin(request.user)
