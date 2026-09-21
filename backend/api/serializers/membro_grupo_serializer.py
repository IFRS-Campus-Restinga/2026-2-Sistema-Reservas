from rest_framework import serializers

from api.models.membro_grupo_model import MembroGrupo


class MembroGrupoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembroGrupo
        fields = '__all__'
        read_only_fields = ['grupo']
