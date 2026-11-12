from django.db import models


class TipoNotificacao(models.TextChoices):
    CONFIRMACAO_RESERVA = "CONFIRMACAO_RESERVA", "Confirmação de reserva"
    CANCELAMENTO_RESERVA = "CANCELAMENTO_RESERVA", "Cancelamento de reserva"
    REJEICAO_RESERVA = "REJEICAO_RESERVA", "Rejeição de reserva"
    TERMO_ENVIADO = "TERMO_ENVIADO", "Termo enviado"
    TERMO_REENVIADO = "TERMO_REENVIADO", "Termo reenviado"
    TERMO_APROVADO = "TERMO_APROVADO", "Termo aprovado"
    TERMO_REJEITADO = "TERMO_REJEITADO", "Termo rejeitado"
    RETIRADA_ENVIADA = "RETIRADA_ENVIADA", "Termo de retirada enviado"
    RETIRADA_REENVIADA = "RETIRADA_REENVIADA", "Termo de retirada reenviado"
    RETIRADA_APROVADA = "RETIRADA_APROVADA", "Termo de retirada aprovado"
    RETIRADA_REJEITADA = "RETIRADA_REJEITADA", "Termo de retirada rejeitado"
    DEVOLUCAO_ENVIADA = "DEVOLUCAO_ENVIADA", "Termo de devolução enviado"
    DEVOLUCAO_REENVIADA = "DEVOLUCAO_REENVIADA", "Termo de devolução reenviado"
    DEVOLUCAO_APROVADA = "DEVOLUCAO_APROVADA", "Termo de devolução aprovado"
    DEVOLUCAO_REJEITADA = "DEVOLUCAO_REJEITADA", "Termo de devolução rejeitado"
    GRUPO_PROXIMO_VENCIMENTO = "GRUPO_PROXIMO_VENCIMENTO", "Vigência do grupo próxima do vencimento"
