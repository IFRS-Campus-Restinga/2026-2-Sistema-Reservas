from rest_framework import serializers

from api.models.grupo_model import Grupo


class GrupoSerializer(serializers.ModelSerializer):
    criador = serializers.PrimaryKeyRelatedField(read_only=True)
    criador_nome = serializers.CharField(source='criador.nome', read_only=True)
    tipo_recurso_descricao = serializers.CharField(source='tipo_recurso.descricao', read_only=True, default=None)

    class Meta:
        model = Grupo
        fields = '__all__'
