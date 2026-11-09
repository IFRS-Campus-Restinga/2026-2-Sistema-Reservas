from rest_framework import serializers

from api.models.reserva_veiculo_model import ReservaVeiculo
from .recorrencia_serializer import RecorrenciaSerializer, validar_recorrencia


class ReservaVeiculoSerializer(serializers.ModelSerializer):
    recorrencia = RecorrenciaSerializer(required=False, allow_null=True)

    class Meta:
        model = ReservaVeiculo
        fields = [
            'id', 'nome', 'descricao', 'status', 'data', 'horario_inicio',
            'horario_fim', 'duracao', 'tipo_reserva', 'usuario', 'veiculo',
            'destino', 'finalidade', 'quantidade_passageiros', 'data_devolucao_prevista',
            'recorrencia',
        ]
        read_only_fields = ['id', 'status', 'duracao', 'tipo_reserva', 'usuario']

    def validate(self, dados):
        recorrencia = dados.get('recorrencia')

        if recorrencia:
            validar_recorrencia(dados.get('data', getattr(self.instance, 'data', None)), recorrencia)

        return dados
