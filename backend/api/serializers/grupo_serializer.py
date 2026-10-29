from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from api.enumerations.tipo_recurso_reservavel import TipoRecursoReservavel
from api.models.grupo_model import Grupo
from api.models.tipo_recurso_model import TipoRecurso
from api.services.autorizacao_grupo_service import salvar_autorizacoes_grupo
from api.validators.autorizacao_grupo_validator import validar_autorizacoes_grupo


class GrupoSerializer(serializers.ModelSerializer):
    criador = serializers.PrimaryKeyRelatedField(read_only=True)
    criador_nome = serializers.CharField(source='criador.nome', read_only=True)
    tipos_recurso_autorizados = serializers.ListField(
        child=serializers.ChoiceField(choices=TipoRecursoReservavel.choices),
    )
    tipos_recurso = serializers.PrimaryKeyRelatedField(
        queryset=TipoRecurso.objects.all(),
        many=True,
        required=False,
    )
    tipos_recurso_descricao = serializers.SerializerMethodField()

    class Meta:
        model = Grupo
        fields = '__all__'

    def get_tipos_recurso_descricao(self, grupo):
        return [tipo_recurso.descricao for tipo_recurso in grupo.tipos_recurso]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if self.instance and 'tipos_recurso_autorizados' not in attrs and 'tipos_recurso' not in attrs:
            return attrs
        tipos_recurso_autorizados = attrs.get(
            'tipos_recurso_autorizados',
            self.instance.tipos_recurso_autorizados if self.instance else [],
        )
        if 'tipos_recurso' in attrs:
            tipos_recurso = attrs['tipos_recurso']
        elif self.instance and TipoRecursoReservavel.RECURSO_GERAL in tipos_recurso_autorizados:
            tipos_recurso = self.instance.tipos_recurso
        else:
            tipos_recurso = []
        tipo_membro_permitido = attrs.get(
            'tipo_membro_permitido',
            getattr(self.instance, 'tipo_membro_permitido', None),
        )
        try:
            validar_autorizacoes_grupo(tipo_membro_permitido, tipos_recurso_autorizados, tipos_recurso)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict)
        attrs['tipos_recurso_autorizados'] = tipos_recurso_autorizados
        attrs['tipos_recurso'] = tipos_recurso
        return attrs

    def create(self, validated_data):
        tipos_recurso_autorizados = validated_data.pop('tipos_recurso_autorizados')
        tipos_recurso = validated_data.pop('tipos_recurso')
        grupo = super().create(validated_data)
        salvar_autorizacoes_grupo(grupo, tipos_recurso_autorizados, tipos_recurso)
        return grupo

    def update(self, instance, validated_data):
        tipos_recurso_autorizados = validated_data.pop('tipos_recurso_autorizados', None)
        tipos_recurso = validated_data.pop('tipos_recurso', None)
        grupo = super().update(instance, validated_data)
        if tipos_recurso_autorizados is not None:
            salvar_autorizacoes_grupo(grupo, tipos_recurso_autorizados, tipos_recurso)
        return grupo
