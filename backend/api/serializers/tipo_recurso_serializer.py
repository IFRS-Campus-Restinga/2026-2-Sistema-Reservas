from rest_framework import serializers
from api.models.tipo_recurso_model import TipoRecurso


class TipoRecursoSerializer(serializers.ModelSerializer):
    categoria_nome = serializers.CharField(source='categoria.nome', read_only=True, allow_null=True)
    categoria_icone = serializers.CharField(source='categoria.icone', read_only=True, allow_null=True)

    class Meta:
        model = TipoRecurso
        fields = "__all__"

    def validate_descricao(self, valor):
        valor = valor.strip()
        if len(valor) < 2:
            raise serializers.ValidationError('Informe uma descrição com pelo menos 2 caracteres.')
        repetidos = TipoRecurso.objects.filter(descricao__iexact=valor)
        if self.instance:
            repetidos = repetidos.exclude(pk=self.instance.pk)
        if repetidos.exists():
            raise serializers.ValidationError('Já existe um tipo de recurso com essa descrição.')
        return valor


class TipoRecursoCatalogoSerializer(TipoRecursoSerializer):
    total_itens = serializers.IntegerField(read_only=True)
    total_unidades = serializers.IntegerField(read_only=True)
    total_termos = serializers.IntegerField(read_only=True)
