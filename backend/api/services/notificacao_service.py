from api.enumerations.tipo_notificacao import TipoNotificacao
from api.models.notificacao_model import Notificacao


def criar_notificacao_confirmacao(reserva):
    """Cria a notificação enviada ao dono quando a reserva é confirmada."""
    notificacao, _ = Notificacao.objects.get_or_create(
        usuario=reserva.usuario,
        reserva=reserva,
        tipo=TipoNotificacao.CONFIRMACAO_RESERVA,
        defaults={
            "titulo": "Reserva confirmada",
            "mensagem": f'Sua reserva "{reserva.nome}" foi confirmada.',
        },
    )
    return notificacao
