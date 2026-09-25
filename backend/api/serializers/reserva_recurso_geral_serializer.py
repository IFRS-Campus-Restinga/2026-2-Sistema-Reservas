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

        read_only_fields = [
            "id",
            "status",
            "duracao",
            "usuario",
        ]

    def validate(self, dados):
        if dados["horario_fim"] <= dados["horario_inicio"]:
            raise serializers.ValidationError({
                "horario_fim": "O horário de fim deve ser posterior ao início."
            })

        if dados["data_devolucao_prevista"] < dados["data"]:
            raise serializers.ValidationError({
                "data_devolucao_prevista": "A devolução não pode ser anterior à reserva."
            })

        return dados
