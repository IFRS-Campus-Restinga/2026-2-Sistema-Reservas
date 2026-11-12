from rest_framework import serializers

from api.models import Area


class AreaSerializer(serializers.ModelSerializer):
    bloco_nome = serializers.CharField(source='bloco.nome', read_only=True)
    equipamentos_detalhe = serializers.SerializerMethodField()

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

    def get_equipamentos_detalhe(self, area):
        return [{'id': equipamento.id, 'nome': equipamento.nome} for equipamento in area.equipamentos.all()]