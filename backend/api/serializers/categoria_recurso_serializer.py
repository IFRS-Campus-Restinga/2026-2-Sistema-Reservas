from rest_framework import serializers

from api.models.categoria_recurso_model import CategoriaRecurso


class CategoriaRecursoSerializer(serializers.ModelSerializer):
    total_tipos = serializers.SerializerMethodField()

    class Meta:
        model = CategoriaRecurso
        fields = ['id', 'nome', 'icone', 'total_tipos']

    def get_total_tipos(self, categoria):
        # A listagem já anota o total; no detalhe, conta direto.
        total = getattr(categoria, 'total_tipos', None)
        return total if total is not None else categoria.tipos.count()

    def validate_nome(self, valor):
        valor = valor.strip()
        if len(valor) < 2:
            raise serializers.ValidationError('Informe um nome com pelo menos 2 caracteres.')
        repetidas = CategoriaRecurso.objects.filter(nome__iexact=valor)
        if self.instance:
            repetidas = repetidas.exclude(pk=self.instance.pk)
        if repetidas.exists():
            raise serializers.ValidationError('Já existe uma categoria com esse nome.')
        return valor
