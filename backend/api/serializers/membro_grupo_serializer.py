from rest_framework import serializers

from api.models.membro_grupo_model import MembroGrupo


class MembroGrupoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembroGrupo
        fields = '__all__'
        read_only_fields = ['grupo']

    def validate(self, attrs):
        grupo = self.context.get('grupo') or getattr(self.instance, 'grupo', None)
        usuario = attrs.get('usuario') or getattr(self.instance, 'usuario', None)
        papel = getattr(usuario, 'papel', None)

        if papel != grupo.tipo_membro_permitido:
            raise serializers.ValidationError(
                {"usuario": f"Apenas usuários com papel de {grupo.get_tipo_membro_permitido_display().lower()} podem ser membros deste grupo."}
            )

        data_fim_validade = attrs.get('data_fim_validade', getattr(self.instance, 'data_fim_validade', None))
        if data_fim_validade:
            if data_fim_validade < grupo.data_inicio_validade:
                raise serializers.ValidationError(
                    {"data_fim_validade": "Não pode ser anterior à data de início de validade do grupo."}
                )
            if grupo.data_fim_validade and data_fim_validade > grupo.data_fim_validade:
                raise serializers.ValidationError(
                    {"data_fim_validade": "Não pode ser posterior à data de fim de validade do grupo."}
                )
        return attrs
