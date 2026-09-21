from rest_framework import serializers

from api.models.grupo_model import Grupo


class GrupoSerializer(serializers.ModelSerializer):
    criador = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Grupo
        fields = '__all__'
