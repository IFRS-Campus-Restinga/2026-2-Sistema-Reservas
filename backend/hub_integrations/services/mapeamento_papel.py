from accounts.enumerations import Papel

_PAPEL_POR_ACCESS_PROFILE = {
    'servidor': Papel.SERVIDOR,
    'aluno': Papel.ALUNO,
    'convidado': Papel.CONVIDADO,
}


def mapear_papel(access_profile: str, groups: list[str]) -> str:
    if 'admin' in groups:
        return Papel.ADMIN

    return _PAPEL_POR_ACCESS_PROFILE.get(access_profile, Papel.CONVIDADO)
