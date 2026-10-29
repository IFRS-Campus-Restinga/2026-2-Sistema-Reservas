from django.contrib.auth import get_user_model
from django.utils import timezone
from api.permissions.regras_comuns import filtro_usuario_admin
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

def criar_notificacao_cancelamento(reserva):
    notificacao, _ = Notificacao.objects.get_or_create(
        usuario=reserva.usuario,
        reserva=reserva,
        tipo=TipoNotificacao.CANCELAMENTO_RESERVA,
        defaults={
            "titulo": "Reserva cancelada",
            "mensagem": f'Sua reserva "{reserva.nome}" foi cancelada pelo administrador.',
        },
    )

    return notificacao

def _registrar_notificacao(usuario, reserva, tipo, titulo, mensagem):
    notificacao, _ = Notificacao.objects.update_or_create(
        usuario=usuario,
        reserva=reserva,
        tipo=tipo,
        defaults={
            "titulo": titulo,
            "mensagem": mensagem[:255],
            "lida": False,
            "lida_em": None,
            "criada_em": timezone.now(),
        },
    )

    return notificacao

def criar_notificacao_termo_enviado(termo, reenviado=False):
    reserva = termo.reserva
    responsavel = termo.enviado_por.nome or termo.enviado_por.email

    tipo = (
        TipoNotificacao.TERMO_REENVIADO
        if reenviado
        else TipoNotificacao.TERMO_ENVIADO
    )

    titulo = (
        "Termo reenviado para análise"
        if reenviado
        else "Novo termo para análise"
    )

    acao = "reenviou" if reenviado else "enviou"

    mensagem = (
        f'{responsavel} {acao} o termo de responsabilidade '
        f'da reserva "{reserva.nome}".'
    )

    Usuario = get_user_model()

    administradores = Usuario.objects.filter(
        filtro_usuario_admin(),
        is_active=True,
    ).distinct()

    for administrador in administradores:
        _registrar_notificacao(
            administrador,
            reserva,
            tipo,
            titulo,
            mensagem,
        )

def criar_notificacao_termo_aprovado(reserva):
    return _registrar_notificacao(
        reserva.usuario,
        reserva,
        TipoNotificacao.TERMO_APROVADO,
        "Termo aprovado",
        (
            f'O termo da reserva "{reserva.nome}" foi aprovado '
            "e sua reserva foi confirmada."
        ),
    )

def criar_notificacao_termo_rejeitado(reserva, motivo):
    motivo = (motivo or "").strip()

    return _registrar_notificacao(
        reserva.usuario,
        reserva,
        TipoNotificacao.TERMO_REJEITADO,
        "Termo recusado",
        (
            f'O termo da reserva "{reserva.nome}" foi recusado. '
            f'Motivo: {motivo}'
        ),
    )
