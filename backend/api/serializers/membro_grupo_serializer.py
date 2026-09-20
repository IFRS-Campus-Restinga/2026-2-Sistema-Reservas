from rest_framework import serializers

from api.models.membro_grupo_model import MembroGrupo
from api.models.grupo_servidor_model import GrupoServidor
from api.models.grupo_aluno_model import GrupoAluno


class MembroGrupoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembroGrupo
        fields = '__all__'
        read_only_fields = ['grupo']

    def validate(self, attrs):
        grupo = self.context.get('grupo') or getattr(self.instance, 'grupo', None)
        usuario = attrs.get('usuario') or getattr(self.instance, 'usuario', None)
        papel = getattr(usuario, 'papel', None)

        if GrupoServidor.objects.filter(pk=grupo.pk).exists() and papel != 'servidor':
            raise serializers.ValidationError(
                {"usuario": "Apenas usuários com papel de servidor podem ser membros deste grupo."}
            )
        if GrupoAluno.objects.filter(pk=grupo.pk).exists() and papel != 'aluno':
            raise serializers.ValidationError(
                {"usuario": "Apenas usuários com papel de aluno podem ser membros deste grupo."}
            )
        return attrs
