from django.core.exceptions import ValidationError

from accounts.enumerations import Papel
from api.enumerations.tipo_recurso_reservavel import TipoRecursoReservavel
from api.permissions.regras_reserva import tipos_autorizaveis_por_grupo


def validar_autorizacoes_grupo(tipo_membro_permitido, tipos_recurso_autorizados, tipos_recurso):
    if not tipos_recurso_autorizados:
        raise ValidationError(
            {"tipos_recurso_autorizados": "Informe ao menos um tipo de recurso autorizado."}
        )
    tipos_autorizaveis = tipos_autorizaveis_por_grupo(tipo_membro_permitido)
    if any(tipo not in tipos_autorizaveis for tipo in tipos_recurso_autorizados):
        rotulos = ', '.join(TipoRecursoReservavel(tipo).label for tipo in tipos_autorizaveis)
        rotulo_membro = Papel(tipo_membro_permitido).label.lower()
        raise ValidationError(
            {"tipos_recurso_autorizados": f"Grupos de {rotulo_membro} só podem autorizar: {rotulos}."}
        )
    autoriza_recurso_geral = TipoRecursoReservavel.RECURSO_GERAL in tipos_recurso_autorizados
    if autoriza_recurso_geral and not tipos_recurso:
        raise ValidationError(
            {"tipos_recurso": "É obrigatório informar ao menos um tipo de recurso geral autorizado (por exemplo, bola)."}
        )
    if not autoriza_recurso_geral and tipos_recurso:
        raise ValidationError(
            {"tipos_recurso": "Este campo só deve ser preenchido quando Recurso Geral estiver entre os recursos autorizados."}
        )
