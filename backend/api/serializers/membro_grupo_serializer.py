from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from accounts.models.hub_user import HubUser
from api.models.membro_grupo_model import MembroGrupo


class CandidatoMembroSerializer(serializers.ModelSerializer):
    class Meta:
        model = HubUser
        fields = ['id', 'nome', 'email', 'papel']


class MembroGrupoSerializer(serializers.ModelSerializer):
    usuario_nome = serializers.CharField(source='usuario.nome', read_only=True)
    usuario_email = serializers.CharField(source='usuario.email', read_only=True)

    class Meta:
        model = MembroGrupo
        fields = '__all__'
        read_only_fields = ['grupo']

    def validate(self, attrs):
        membro = self.instance or MembroGrupo(grupo=self.context['grupo'])
        for campo, valor in attrs.items():
            setattr(membro, campo, valor)
        try:
            membro.clean()
        except DjangoValidationError as erro:
            raise serializers.ValidationError(erro.message_dict)
        return attrs
