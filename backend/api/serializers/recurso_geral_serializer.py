from rest_framework import serializers
from api.models.recurso_geral_model import RecursoGeral


class RecursoGeralSerializer(serializers.ModelSerializer):

    class Meta:
        model = RecursoGeral
        fields = "__all__"

    def validate_nome(self, value):
        nome = value.strip()

        if len(nome) < 3:
            raise serializers.ValidationError(
                "O nome do recurso deve ter pelo menos 3 caracteres."
            )

        return nome

    def validate_quantidade_total(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "A quantidade total não pode ser negativa."
            )

        return value

    def validate_quantidade_reservada(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "A quantidade reservada não pode ser negativa."
            )

        return value