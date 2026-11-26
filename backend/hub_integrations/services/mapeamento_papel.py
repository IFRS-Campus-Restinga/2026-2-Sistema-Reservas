from accounts.enumerations import Papel
from accounts.services.administrador_service import e_administrador

_PAPEL_POR_ACCESS_PROFILE = {
    'servidor': Papel.SERVIDOR,
    'aluno': Papel.ALUNO,
    'convidado': Papel.CONVIDADO,
}


def mapear_papel(access_profile: str, email: str) -> str:
    if e_administrador(email):
        return Papel.ADMIN

    return _PAPEL_POR_ACCESS_PROFILE.get(access_profile, Papel.CONVIDADO)
