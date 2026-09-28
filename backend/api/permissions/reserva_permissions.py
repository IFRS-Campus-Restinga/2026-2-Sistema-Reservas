from .regras_comuns import UsuarioAutenticado, usuario_e_admin


def usuario_e_dono_ou_admin(user, reserva):
    return usuario_e_admin(user) or reserva.usuario_id == user.id


class PodeGerenciarReserva(UsuarioAutenticado):
    message = "Apenas o responsável pela reserva ou um administrador pode realizar esta ação."

    def has_object_permission(self, request, view, obj):
        return usuario_e_dono_ou_admin(request.user, obj)
