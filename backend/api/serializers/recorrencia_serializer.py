from rest_framework import serializers
from api.models.recorrencia_model import Recorrencia

LIMITE_DIAS_RECORRENCIA = 365


class RecorrenciaSerializer(serializers.ModelSerializer):
    pular_conflitos = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = Recorrencia
        fields = ["id", "tipo", "data_inicio", "data_fim", "pular_conflitos"]
        read_only_fields = ["id", "data_inicio"]


def validar_recorrencia(data, recorrencia):
    data_fim = recorrencia["data_fim"]

    if data_fim <= data:
        raise serializers.ValidationError(
            {"recorrencia": "A data de fim da recorrência deve ser posterior à data da reserva."}
        )

    if (data_fim - data).days > LIMITE_DIAS_RECORRENCIA:
        raise serializers.ValidationError(
            {"recorrencia": f"A recorrência pode durar no máximo {LIMITE_DIAS_RECORRENCIA} dias."}
        )
