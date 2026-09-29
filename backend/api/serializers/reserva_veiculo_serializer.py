from rest_framework import serializers

from api.models.reserva_veiculo_model import ReservaVeiculo


class ReservaVeiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReservaVeiculo
        fields = [
            'id', 'nome', 'descricao', 'status', 'data', 'horario_inicio',
            'horario_fim', 'duracao', 'tipo_reserva', 'usuario', 'veiculo',
            'destino', 'finalidade', 'quantidade_passageiros', 'data_devolucao_prevista',
        ]
        read_only_fields = ['id', 'status', 'duracao', 'tipo_reserva', 'usuario']
