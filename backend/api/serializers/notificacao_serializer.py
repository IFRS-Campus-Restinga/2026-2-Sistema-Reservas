from rest_framework import serializers

from api.models.notificacao_model import Notificacao
from api.enumerations.tipo_notificacao import TipoNotificacao
from api.services.termo_service import reserva_concreta

class NotificacaoSerializer(serializers.ModelSerializer):
    reserva = serializers.SerializerMethodField()
    motivo_rejeicao_termo = serializers.SerializerMethodField()

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
            "motivo_rejeicao_termo",
        ]

    def get_reserva(self, notificacao):
        reserva = notificacao.reserva
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
    def get_motivo_rejeicao_termo(self, notificacao):
        if notificacao.tipo != TipoNotificacao.TERMO_REJEITADO:
            return None

        termo = getattr(
            notificacao.reserva,
            'termos_rejeitados',
            [],
        )

        if not termo:
            return None

        return termo[0].motivo_rejeicao
    