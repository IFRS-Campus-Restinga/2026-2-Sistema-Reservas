from accounts.enumerations import Papel
from accounts.models import AdministradorAutorizado, HubUser


def e_administrador(email):
    return AdministradorAutorizado.objects.filter(email__iexact=email).exists()


def autorizar_administrador(email):
    AdministradorAutorizado.objects.get_or_create(email=email.lower())
    HubUser.objects.filter(email__iexact=email).update(papel=Papel.ADMIN, is_staff=True, is_superuser=True)
