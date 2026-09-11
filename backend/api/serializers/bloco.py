from rest_framework import serializers
from api.models.bloco import Bloco
from api.enumerations.acessibilidade import Acessibilidade

"""
Serializer para o model Bloco.

Responsável por serializar os campos da estrutura física de blocos
e validar a lista de opções do enum de acessibilidade.
"""

class BlocoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bloco
        fields = ['id', 'numero', 'nome', 'banheiro', 'acessibilidade']

    def validate_acessibilidade(self, value):

        opcoes_validas = set(Acessibilidade.values)
        for item in value:
            if item not in opcoes_validas:
                raise serializers.ValidationError(
                    f"'{item}' não é uma opção válida de acessibilidade."
                )
        return value