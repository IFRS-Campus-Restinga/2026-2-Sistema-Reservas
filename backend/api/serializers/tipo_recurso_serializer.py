from rest_framework import serializers
from api.models.tipo_recurso_model import TipoRecurso


class TipoRecursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoRecurso
        fields = "__all__"
