from rest_framework import serializers
from api.models.recurso_geral_model import RecursoGeral
from datetime import datetime, timedelta
from django.utils import timezone
from api.validators.reserva_recurso_geral_validator import ocupacao_maxima

class RecursoGeralSerializer(serializers.ModelSerializer):

    quantidade_reservada = serializers.SerializerMethodField()

    def get_quantidade_reservada(self, recurso):
        agora = timezone.localtime().replace(tzinfo=None)
        return ocupacao_maxima(recurso, agora, agora + timedelta(seconds=1))

    class Meta:
        model = RecursoGeral
        fields = "__all__"
        read_only_fields = ["quantidade_reservada"]
        extra_kwargs = {"observacao": {"allow_blank": True, "required": False}}

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

        agora = timezone.localtime().replace(tzinfo=None)
        if self.instance and value < ocupacao_maxima(self.instance, agora, datetime.max):
            raise serializers.ValidationError(
                "A quantidade total não pode ser menor que a quantidade reservada."
            )

        return value
