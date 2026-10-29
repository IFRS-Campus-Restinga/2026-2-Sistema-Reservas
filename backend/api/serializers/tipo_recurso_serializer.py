from rest_framework import serializers
from api.models.tipo_recurso_model import TipoRecurso


class TipoRecursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoRecurso
        fields = "__all__"


class TipoRecursoCatalogoSerializer(TipoRecursoSerializer):
    categoria = serializers.CharField(source='categoria_catalogo', read_only=True)
    total_itens = serializers.IntegerField(read_only=True)
    total_unidades = serializers.IntegerField(read_only=True)
    total_termos = serializers.IntegerField(read_only=True)
