from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone

from accounts.enumerations import Papel
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
        Q(papel=Papel.ADMIN) | Q(is_staff=True),
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
    notificacao, _ = Notificacao.objects.update_or_create(
        usuario=reserva.usuario,
        reserva=reserva,
        tipo=TipoNotificacao.TERMO_APROVADO,
        defaults={
            "titulo": "Termo aprovado",
            "mensagem": (
                f'O termo da reserva "{reserva.nome}" foi aprovado '
                "e sua reserva foi confirmada."
            ),
            "lida": False,
            "lida_em": None,
            "criada_em": timezone.now(),
        },
    )

    return notificacao

def criar_notificacao_termo_rejeitado(reserva, motivo):
    motivo = (motivo or "").strip()

    mensagem = (
        f'O termo da reserva "{reserva.nome}" foi recusado. '
        f"Motivo: {motivo}"
    )

    notificacao, _ = Notificacao.objects.update_or_create(
        usuario=reserva.usuario,
        reserva=reserva,
        tipo=TipoNotificacao.TERMO_REJEITADO,
        defaults={
            "titulo": "Termo recusado",
            "mensagem": mensagem[:255],
            "lida": False,
            "lida_em": None,
            "criada_em": timezone.now(),
        },
    )

    return notificacao