from rest_framework import serializers
from api.models.recorrencia_model import Recorrencia

LIMITE_DIAS_RECORRENCIA = 365


class RecorrenciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recorrencia
        fields = ["id", "tipo", "data_inicio", "data_fim"]
        read_only_fields = ["id", "data_inicio"]
