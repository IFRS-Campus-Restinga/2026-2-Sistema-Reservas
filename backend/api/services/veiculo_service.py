from rest_framework.exceptions import ValidationError

from api.enumerations import StatusRecurso
from api.services.reserva_veiculo_service import reservas_bloqueantes


def validar_alteracao_veiculo(veiculo, dados):
    abertas = reservas_bloqueantes(veiculo)
    novo_status = dados.get('status', veiculo.status)
    if novo_status != veiculo.status and novo_status in (StatusRecurso.INATIVO, StatusRecurso.MANUTENCAO) and abertas.exists():
        raise ValidationError({'status': 'Não é possível alterar o veículo para inativo ou manutenção porque existem reservas em aberto. Verifique ou cancele essas reservas antes de continuar.'})
    capacidade = dados.get('capacidade', veiculo.capacidade)
    if capacidade < veiculo.capacidade and abertas.filter(quantidade_passageiros__gt=capacidade).exists():
        raise ValidationError({'capacidade': 'Existem reservas em aberto com mais ocupantes que a nova capacidade. Verifique ou cancele essas reservas antes de continuar.'})


def validar_exclusao_veiculo(veiculo):
    if veiculo.reservas.exists():
        raise ValidationError({'detail': 'Não é possível excluir um veículo com reservas vinculadas. Verifique as reservas em aberto antes de inativá-lo.'})
