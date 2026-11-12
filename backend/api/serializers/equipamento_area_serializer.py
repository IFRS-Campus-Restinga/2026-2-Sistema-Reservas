from rest_framework import serializers

from api.models.equipamento_area_model import EquipamentoArea


class EquipamentoAreaSerializer(serializers.ModelSerializer):
    total_areas = serializers.SerializerMethodField()

    class Meta:
        model = EquipamentoArea
        fields = ['id', 'nome', 'total_areas']

    def get_total_areas(self, equipamento):
        # A listagem já anota o total; no detalhe, conta direto.
        total = getattr(equipamento, 'total_areas', None)
        return total if total is not None else equipamento.areas.count()

    def validate_nome(self, valor):
        valor = valor.strip()
        if len(valor) < 2:
            raise serializers.ValidationError('Informe um nome com pelo menos 2 caracteres.')
        repetidos = EquipamentoArea.objects.filter(nome__iexact=valor)
        if self.instance:
            repetidos = repetidos.exclude(pk=self.instance.pk)
        if repetidos.exists():
            raise serializers.ValidationError('Já existe um equipamento com esse nome.')
        return valor
