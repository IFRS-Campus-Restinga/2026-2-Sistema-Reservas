from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from api.permissions.regras_comuns import filtro_usuario_admin, usuario_e_admin
from api.enumerations.status_termo import StatusTermo
from api.enumerations.tipo_notificacao import TipoNotificacao
from api.enumerations.tipo_termo import TipoTermo
from api.models.grupo_model import Grupo
from api.models.notificacao_model import Notificacao

DIAS_AVISO_VENCIMENTO_GRUPO = 7

NOTIFICACOES_TERMO_OPERACIONAL = {
    TipoTermo.RETIRADA_VEICULO: {
        'nome': 'retirada',
        'enviado': TipoNotificacao.RETIRADA_ENVIADA,
        'reenviado': TipoNotificacao.RETIRADA_REENVIADA,
        'aprovado': TipoNotificacao.RETIRADA_APROVADA,
        'rejeitado': TipoNotificacao.RETIRADA_REJEITADA,
        'apos_aprovacao': 'Ao devolver o veículo, envie o termo de devolução.',
    },
    TipoTermo.DEVOLUCAO_VEICULO: {
        'nome': 'devolução',
        'enviado': TipoNotificacao.DEVOLUCAO_ENVIADA,
        'reenviado': TipoNotificacao.DEVOLUCAO_REENVIADA,
        'aprovado': TipoNotificacao.DEVOLUCAO_APROVADA,
        'rejeitado': TipoNotificacao.DEVOLUCAO_REJEITADA,
        'apos_aprovacao': 'A reserva foi concluída.',
    },
}

# Qual documento cada tipo de notificação de termo se refere (usado pelo serializer).
TIPO_TERMO_POR_NOTIFICACAO = {
    TipoNotificacao.TERMO_ENVIADO: TipoTermo.RESPONSABILIDADE,
    TipoNotificacao.TERMO_REENVIADO: TipoTermo.RESPONSABILIDADE,
    TipoNotificacao.TERMO_APROVADO: TipoTermo.RESPONSABILIDADE,
    TipoNotificacao.TERMO_REJEITADO: TipoTermo.RESPONSABILIDADE,
}
for _tipo_termo, _config in NOTIFICACOES_TERMO_OPERACIONAL.items():
    for _evento in ('enviado', 'reenviado', 'aprovado', 'rejeitado'):
        TIPO_TERMO_POR_NOTIFICACAO[_config[_evento]] = _tipo_termo

TIPOS_NOTIFICACAO_TERMO_REJEITADO = (
    TipoNotificacao.TERMO_REJEITADO,
    TipoNotificacao.RETIRADA_REJEITADA,
    TipoNotificacao.DEVOLUCAO_REJEITADA,
)


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


def criar_notificacao_cancelamento_por_terceiro(reserva, ator):
    """Notifica o dono da reserva quando ela é cancelada por um administrador ou pelo criador do grupo."""
    nome_ator = getattr(ator, 'nome', None) or getattr(ator, 'email', None) or 'administrador'
    if usuario_e_admin(ator):
        mensagem = f'Sua reserva "{reserva.nome}" foi cancelada pela administração ({nome_ator}).'
    else:
        mensagem = f'Sua reserva "{reserva.nome}" foi cancelada pelo responsável do grupo ({nome_ator}).'

    return _registrar_notificacao(
        usuario=reserva.usuario,
        reserva=reserva,
        tipo=TipoNotificacao.CANCELAMENTO_RESERVA,
        titulo="Reserva cancelada",
        mensagem=mensagem,
    )


def criar_notificacao_alteracao_por_terceiro(reserva, ator):
    """Notifica o dono da reserva quando ela é alterada por um administrador ou pelo criador do grupo."""
    nome_ator = getattr(ator, 'nome', None) or getattr(ator, 'email', None) or 'administrador'
    if usuario_e_admin(ator):
        mensagem = f'Sua reserva "{reserva.nome}" foi alterada pela administração ({nome_ator}).'
    else:
        mensagem = f'Sua reserva "{reserva.nome}" foi alterada pelo responsável do grupo ({nome_ator}).'

    return _registrar_notificacao(
        usuario=reserva.usuario,
        reserva=reserva,
        tipo=TipoNotificacao.ALTERACAO_RESERVA,
        titulo="Reserva alterada",
        mensagem=mensagem,
    )

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


def criar_notificacao_termo_operacional_enviado(termo, reenviado=False):
    """Avisa os administradores sobre envio/reenvio do termo de retirada ou devolução."""
    reserva = termo.reserva
    config = NOTIFICACOES_TERMO_OPERACIONAL[termo.tipo]
    nome = config['nome']
    responsavel = termo.enviado_por.nome or termo.enviado_por.email

    tipo = config['reenviado'] if reenviado else config['enviado']
    titulo = (
        f'Termo de {nome} reenviado para análise'
        if reenviado
        else f'Novo termo de {nome} para análise'
    )
    acao = 'reenviou' if reenviado else 'enviou'
    mensagem = f'{responsavel} {acao} o termo de {nome} da reserva "{reserva.nome}".'

    administradores = get_user_model().objects.filter(
        filtro_usuario_admin(),
        is_active=True,
    ).distinct()

    for administrador in administradores:
        _registrar_notificacao(administrador, reserva, tipo, titulo, mensagem)


def criar_notificacao_termo_operacional_analisado(reserva, tipo_termo, decisao, motivo=''):
    """Avisa o responsável pela reserva sobre a análise do termo de retirada ou devolução."""
    config = NOTIFICACOES_TERMO_OPERACIONAL[tipo_termo]
    nome = config['nome']

    if decisao == StatusTermo.APROVADO:
        return _registrar_notificacao(
            reserva.usuario,
            reserva,
            config['aprovado'],
            f'Termo de {nome} aprovado',
            f'O termo de {nome} da reserva "{reserva.nome}" foi aprovado. {config["apos_aprovacao"]}',
        )

    motivo = (motivo or '').strip()
    return _registrar_notificacao(
        reserva.usuario,
        reserva,
        config['rejeitado'],
        f'Termo de {nome} recusado',
        f'O termo de {nome} da reserva "{reserva.nome}" foi recusado. Motivo: {motivo}',
    )


def _mensagem_vencimento_grupo(grupo, hoje):
    data_formatada = grupo.data_fim_validade.strftime("%d/%m/%Y")
    dias_restantes = (grupo.data_fim_validade - hoje).days
    if dias_restantes == 0:
        return f'A vigência do grupo "{grupo.nome}" vence hoje ({data_formatada}).'
    if dias_restantes == 1:
        return f'A vigência do grupo "{grupo.nome}" vence amanhã ({data_formatada}).'
    return f'A vigência do grupo "{grupo.nome}" vence em {dias_restantes} dias ({data_formatada}).'


def notificar_grupos_proximos_vencimento(usuario, dias_antecedencia=DIAS_AVISO_VENCIMENTO_GRUPO):
    """Garante notificação ao criador para grupos ativos que vencem dentro da janela configurada."""
    if not getattr(usuario, "is_authenticated", False) or usuario.pk is None:
        return []

    hoje = timezone.localdate()
    limite = hoje + timedelta(days=dias_antecedencia)
    grupos = list(
        Grupo.objects.filter(
            criador=usuario,
            data_fim_validade__gte=hoje,
            data_fim_validade__lte=limite,
        )
    )
    if not grupos:
        return []

    existentes = {
        notificacao.grupo_id: notificacao
        for notificacao in Notificacao.objects.filter(
            usuario=usuario,
            tipo=TipoNotificacao.GRUPO_PROXIMO_VENCIMENTO,
            grupo_id__in=[grupo.id for grupo in grupos],
        )
    }

    criadas_ou_atualizadas = []
    agora = timezone.now()
    for grupo in grupos:
        existente = existentes.get(grupo.id)
        if existente and existente.data_referencia == grupo.data_fim_validade:
            continue

        notificacao, _ = Notificacao.objects.update_or_create(
            usuario=usuario,
            grupo=grupo,
            tipo=TipoNotificacao.GRUPO_PROXIMO_VENCIMENTO,
            defaults={
                "titulo": "Vigência de grupo próxima do vencimento",
                "mensagem": _mensagem_vencimento_grupo(grupo, hoje)[:255],
                "data_referencia": grupo.data_fim_validade,
                "lida": False,
                "lida_em": None,
                "criada_em": agora,
            },
        )
        criadas_ou_atualizadas.append(notificacao)

    return criadas_ou_atualizadas
