from rest_framework import serializers
from api.models.reserva_recurso_geral_model import ReservaRecursoGeral
from django.utils import timezone

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
        agora = timezone.localtime()

        if dados["data"] < agora.date():
            raise serializers.ValidationError({
                "data": "Não é possível reservar uma data passada."
            })

        if (
            dados["data"] == agora.date()
            and dados["horario_inicio"] <= agora.time().replace(tzinfo=None)
        ):
            raise serializers.ValidationError({
                "horario_inicio": "O horário de início deve ser posterior ao horário atual."
            })

        if dados["horario_fim"] <= dados["horario_inicio"]:
            raise serializers.ValidationError({
                "horario_fim": "O horário de fim deve ser posterior ao início."
            })

        if dados["data_devolucao_prevista"] < dados["data"]:
            raise serializers.ValidationError({
                "data_devolucao_prevista": "A devolução não pode ser anterior à reserva."
            })

        return dados
