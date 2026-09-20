from accounts.enumerations import Papel


def usuario_e_admin(user):
    return bool(
        user and user.is_authenticated and
        (user.is_staff or getattr(user, 'papel', None) == Papel.ADMIN)
    )
