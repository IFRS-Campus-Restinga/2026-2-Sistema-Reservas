from rest_framework import serializers

from api.models.notificacao_model import Notificacao


class NotificacaoSerializer(serializers.ModelSerializer):
    reserva = serializers.SerializerMethodField()

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
        ]

    def get_reserva(self, notificacao):
        reserva = notificacao.reserva
        cancelada_por = reserva.cancelada_por
        return {
            "id": reserva.id,
            "nome": reserva.nome,
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
