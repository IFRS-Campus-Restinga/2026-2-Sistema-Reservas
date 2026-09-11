from rest_framework import serializers
from api.models.bloco_model import Bloco
from api.enumerations.acessibilidade import Acessibilidade


class BlocoSerializer(serializers.ModelSerializer):
    """
    Serializer para o modelo Bloco.
    Mapeia todos os campos da Model e executa as validações de integridade e negócio.
    """

    class Meta:
        model = Bloco
        fields = "__all__"

    def validate_numero(self, value):
        """
        Valida o campo 'numero' do Bloco.

        Regras:
        - Deve conter apenas caracteres numéricos (dígitos).
        - Deve ter tamanho máximo de 2 caracteres.
        - Deve ser único no sistema (desconsiderando a própria instância durante edições).

        Raises:
            serializers.ValidationError: Se contiver caracteres não numéricos,
            exceder 2 dígitos ou já estiver cadastrado em outro bloco.
        """
        if not value.isdigit() or len(value) > 2:
            raise serializers.ValidationError(
                "O número do bloco deve conter no máximo 2 dígitos numéricos."
            )

        instance = getattr(self, 'instance', None)
        if Bloco.objects.filter(numero=value).exclude(pk=getattr(instance, 'pk', None)).exists():
            raise serializers.ValidationError("Já existe um bloco cadastrado com este número.")

        return value

    def validate_nome(self, value):
        """
        Valida e sanitiza o campo 'nome' do Bloco.

        Regras:
        - Remove espaços em branco nas extremidades (strip).
        - Deve possuir no mínimo 3 caracteres.
        - Deve ser único no sistema sem diferenciar maiúsculas/minúsculas (iexact).

        Raises:
            serializers.ValidationError: Se o nome sanitizado tiver menos de
            3 caracteres ou se já existir um bloco com o mesmo nome (case-insensitive).
        """
        nome_sanitizado = value.strip()
        if len(nome_sanitizado) < 3:
            raise serializers.ValidationError("O nome do bloco deve ter pelo menos 3 caracteres.")

        instance = getattr(self, 'instance', None)
        if Bloco.objects.filter(nome__iexact=nome_sanitizado).exclude(pk=getattr(instance, 'pk', None)).exists():
            raise serializers.ValidationError("Já existe um bloco cadastrado com este nome.")

        return nome_sanitizado

    def validate_acessibilidade(self, value):
        """
        Valida o campo 'acessibilidade' do Bloco.

        Regras:
        - Deve ser obrigatoriamente uma lista.
        - Remove elementos duplicados enviados no payload.
        - Todos os itens da lista devem pertencer às opções da enumeração Acessibilidade.

        Raises:
            serializers.ValidationError: Se o dado não for um tipo lista ou se
            contiver valores não declarados na enumeração Acessibilidade.
        """
        if not isinstance(value, list):
            raise serializers.ValidationError("O campo acessibilidade deve ser uma lista.")

        itens_unicos = set(value)
        opcoes_validas = set(Acessibilidade.values)

        for item in itens_unicos:
            if item not in opcoes_validas:
                raise serializers.ValidationError(
                    f"'{item}' não é uma opção válida de acessibilidade."
                )

        return list(itens_unicos)