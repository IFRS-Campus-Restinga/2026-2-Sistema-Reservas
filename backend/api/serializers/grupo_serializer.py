from rest_framework import serializers

from api.models.grupo_model import Grupo


class GrupoSerializer(serializers.ModelSerializer):
    criador = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Grupo
        fields = '__all__'

    def validate_nome(self, value):
        nome_sanitizado = value.strip()
        if len(nome_sanitizado) < 3:
            raise serializers.ValidationError("O nome do grupo deve ter pelo menos 3 caracteres.")
        return nome_sanitizado

    def validate(self, attrs):
        data_inicio = attrs.get('data_inicio_validade', getattr(self.instance, 'data_inicio_validade', None))
        data_fim = attrs.get('data_fim_validade', getattr(self.instance, 'data_fim_validade', None))
        if data_inicio and data_fim and data_fim < data_inicio:
            raise serializers.ValidationError(
                {"data_fim_validade": "A data de fim de validade não pode ser anterior à data de início."}
            )

        tipo_recurso_autorizado = attrs.get(
            'tipo_recurso_autorizado', getattr(self.instance, 'tipo_recurso_autorizado', None)
        )
        tipo_recurso = attrs.get('tipo_recurso', getattr(self.instance, 'tipo_recurso', None))
        if tipo_recurso_autorizado == 'RECURSO_GERAL' and not tipo_recurso:
            raise serializers.ValidationError(
                {"tipo_recurso": "É obrigatório informar o tipo de recurso geral autorizado (por exemplo, bola)."}
            )
        if tipo_recurso_autorizado != 'RECURSO_GERAL' and tipo_recurso:
            raise serializers.ValidationError(
                {"tipo_recurso": "Este campo só deve ser preenchido quando o tipo de recurso autorizado for Recurso Geral."}
            )
        return attrs
