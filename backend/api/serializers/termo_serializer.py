from rest_framework import serializers

from api.enumerations.status_termo import StatusTermo


class AnaliseTermoSerializer(serializers.Serializer):
    termo_id = serializers.IntegerField(min_value=1)
    status = serializers.ChoiceField(choices=[StatusTermo.APROVADO, StatusTermo.REJEITADO])
    motivo = serializers.CharField(max_length=1000, required=False, allow_blank=True, default='')

    def validate(self, dados):
        if dados['status'] == StatusTermo.REJEITADO and not dados['motivo'].strip():
            raise serializers.ValidationError({'motivo': 'Informe o motivo da rejeição.'})
        return dados
