from rest_framework import serializers

from api.enumerations.area_enumerations.area_enums import EquipamentoArea
from api.models import Area


class AreaSerializer(serializers.ModelSerializer):
    """
    Serializer responsável pela validação e serialização da entidade Area.
    """

    class Meta:
        model = Area
        fields = '__all__'

    def validate_nome(self, value):
        """
        Garante que o nome não contenha apenas espaços em branco.
        """
        nome_limpo = value.strip()
        if len(nome_limpo) < 5:
            raise serializers.ValidationError(
                "O nome da área deve ter no mínimo 5 caracteres válidos."
            )
        return nome_limpo

    def validate_equipamento(self, value):
        """
        Valida se os itens da lista pertencem ao enum EquipamentoArea.
        """
        if not isinstance(value, list):
            raise serializers.ValidationError("O campo equipamento deve ser uma lista.")

        opcoes_validas = set(EquipamentoArea.values)
        for item in value:
            if item not in opcoes_validas:
                raise serializers.ValidationError(
                    f"O equipamento '{item}' é inválido. Opções aceitas: {list(opcoes_validas)}"
                )
        return value