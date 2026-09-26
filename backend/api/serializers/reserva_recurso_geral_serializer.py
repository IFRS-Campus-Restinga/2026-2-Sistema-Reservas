
from django.utils import timezone
from rest_framework import serializers

from api.models.reserva_recurso_geral_model import ReservaRecursoGeral


class ReservaRecursoGeralSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReservaRecursoGeral
        fields = [
            "id",
            "nome",
            "descricao",
            "status",
            "data",
            "horario_inicio",
            "horario_fim",
            "duracao",
            "tipo_reserva",
            "usuario",
            "recurso_geral",
            "data_devolucao_prevista",
            "quantidades",
        ]
        read_only_fields = ["id", "status", "duracao", "usuario"]

    def validate(self, dados):
        def valor(campo):
            return dados.get(campo, getattr(self.instance, campo, None))

        data = valor("data")
        inicio = valor("horario_inicio")
        fim = valor("horario_fim")
        devolucao = valor("data_devolucao_prevista")
        agora = timezone.localtime()

        if data < agora.date():
            raise serializers.ValidationError({
                "data": "Não é possível reservar uma data passada."
            })

        if data == agora.date() and inicio <= agora.time().replace(tzinfo=None):
            raise serializers.ValidationError({
                "horario_inicio": "O horário de início deve ser posterior ao horário atual."
            })

        if fim <= inicio:
            raise serializers.ValidationError({
                "horario_fim": "O horário de fim deve ser posterior ao início."
            })

        if devolucao < data:
            raise serializers.ValidationError({
                "data_devolucao_prevista": "A devolução não pode ser anterior à reserva."
            })

        return dados
