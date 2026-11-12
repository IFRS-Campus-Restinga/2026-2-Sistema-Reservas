from rest_framework import serializers

from api.models.notificacao_model import Notificacao
from api.enumerations.tipo_termo import TipoTermo
from api.services.notificacao_service import TIPO_TERMO_POR_NOTIFICACAO, TIPOS_NOTIFICACAO_TERMO_REJEITADO
from api.services.termo_service import reserva_concreta

DOCUMENTO_POR_TIPO_TERMO = {
    TipoTermo.RESPONSABILIDADE: 'responsabilidade',
    TipoTermo.RETIRADA_VEICULO: 'retirada',
    TipoTermo.DEVOLUCAO_VEICULO: 'devolucao',
}

class NotificacaoSerializer(serializers.ModelSerializer):
    reserva = serializers.SerializerMethodField()
    grupo = serializers.SerializerMethodField()
    motivo_rejeicao_termo = serializers.SerializerMethodField()
    termo_tipo = serializers.SerializerMethodField()

    class Meta:
        model = Notificacao
        fields = [
            "id",
            "tipo",
            "titulo",
            "mensagem",
            "lida",
            "criada_em",
            "lida_em",
            "reserva",
            "grupo",
            "motivo_rejeicao_termo",
            "termo_tipo",
        ]

    def get_reserva(self, notificacao):
        reserva = notificacao.reserva
        if reserva is None:
            return None
        cancelada_por = reserva.cancelada_por
        _, modalidade = reserva_concreta(reserva)
        return {
            "id": reserva.id,
            "nome": reserva.nome,
            "modalidade": modalidade,
            "status": reserva.status,
            "data": reserva.data,
            "horario_inicio": reserva.horario_inicio,
            "horario_fim": reserva.horario_fim,
            "motivo_cancelamento": reserva.motivo_cancelamento,
            "cancelada_em": reserva.cancelada_em,
            "cancelada_por": (
                {
                    "id": cancelada_por.id,
                    "nome": cancelada_por.nome,
                    "email": cancelada_por.email,
                }
                if cancelada_por
                else None
            ),
        }

    def get_grupo(self, notificacao):
        grupo = notificacao.grupo
        if grupo is None:
            return None
        return {
            "id": grupo.id,
            "nome": grupo.nome,
            "tipo_membro_permitido": grupo.tipo_membro_permitido,
            "data_inicio_validade": grupo.data_inicio_validade,
            "data_fim_validade": grupo.data_fim_validade,
        }

    def get_termo_tipo(self, notificacao):
        return DOCUMENTO_POR_TIPO_TERMO.get(TIPO_TERMO_POR_NOTIFICACAO.get(notificacao.tipo))

    def get_motivo_rejeicao_termo(self, notificacao):
        if not notificacao.reserva_id or notificacao.tipo not in TIPOS_NOTIFICACAO_TERMO_REJEITADO:
            return None

        termo = getattr(
            notificacao.reserva,
            'termos_rejeitados',
            [],
        )

        tipo_termo = TIPO_TERMO_POR_NOTIFICACAO[notificacao.tipo]

        return next(
            (item.motivo_rejeicao for item in termo if item.tipo == tipo_termo),
            None,
        )
