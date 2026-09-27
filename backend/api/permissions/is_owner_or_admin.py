from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    message = "Você só pode editar ou cancelar as suas próprias reservas."

    def has_object_permission(self, request, view, obj):
        usuario = request.user
        is_admin = usuario.is_staff or getattr(usuario, "papel", None) == "admin"

        return bool(is_admin or obj.usuario == usuario)
