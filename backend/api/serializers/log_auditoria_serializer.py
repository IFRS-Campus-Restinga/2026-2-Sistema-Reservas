from rest_framework import serializers

from api.models.log_auditoria_model import LogAuditoria
from api.services.auditoria import rotulos_campos


class LogAuditoriaSerializer(serializers.ModelSerializer):
    responsavel_nome = serializers.CharField(source='responsavel.nome', read_only=True)
    responsavel_email = serializers.CharField(source='responsavel.email', read_only=True)
    perfil_responsavel_descricao = serializers.CharField(source='get_perfil_responsavel_display', read_only=True)
    usuario_afetado_nome = serializers.CharField(source='usuario_afetado.nome', read_only=True, default=None)
    usuario_afetado_email = serializers.CharField(source='usuario_afetado.email', read_only=True, default=None)
    acao_descricao = serializers.CharField(source='get_acao_display', read_only=True)
    entidade_descricao = serializers.CharField(source='get_entidade_display', read_only=True)

    class Meta:
        model = LogAuditoria
        fields = [
            'id',
            'data',
            'responsavel',
            'responsavel_nome',
            'responsavel_email',
            'perfil_responsavel',
            'perfil_responsavel_descricao',
            'acao',
            'acao_descricao',
            'entidade',
            'entidade_descricao',
            'objeto_id',
            'descricao',
            'usuario_afetado',
            'usuario_afetado_nome',
            'usuario_afetado_email',
        ]


class LogAuditoriaDetalheSerializer(LogAuditoriaSerializer):
    rotulos = serializers.SerializerMethodField()

    class Meta(LogAuditoriaSerializer.Meta):
        fields = LogAuditoriaSerializer.Meta.fields + ['dados_antes', 'dados_depois', 'rotulos']

    def get_rotulos(self, log):
        return rotulos_campos(log.entidade)
