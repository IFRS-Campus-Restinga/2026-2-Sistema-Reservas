from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from api.enumerations import StatusReserva, StatusRecurso
from api.enumerations.tipo_recurso_reservavel import TipoRecursoReservavel
from api.models.reserva_veiculo_model import ReservaVeiculo
from api.permissions.regras_comuns import usuario_e_admin
from api.permissions.regras_reserva import pode_reservar
from api.permissions.reserva_permissions import usuario_e_dono_ou_admin


STATUS_RESERVAS_ABERTAS = (
    StatusReserva.PENDENTE, StatusReserva.AGUARDANDO_TERMO, StatusReserva.CONFIRMADA,
)
STATUS_RESERVAS_FINAIS = (
    StatusReserva.CANCELADA, StatusReserva.REJEITADA, StatusReserva.CONCLUIDA,
)
MARGEM_ENTRE_RESERVAS = timedelta(hours=1)
PRAZO_GERENCIAMENTO = timedelta(hours=1)


def instante(data, horario):
    return timezone.make_aware(datetime.combine(data, horario), timezone.get_default_timezone())


def intervalo_reserva(reserva):
    return (
        instante(reserva.data, reserva.horario_inicio),
        instante(reserva.data_devolucao_prevista, reserva.horario_fim),
    )


def validar_intervalo(dados):
    inicio = instante(dados['data'], dados['horario_inicio'])
    fim = instante(dados['data_devolucao_prevista'], dados['horario_fim'])
    if fim <= inicio:
        raise ValidationError({'horario_fim': 'A devolução deve ser posterior à retirada.'})
    return inicio, fim


def validar_gerenciamento(usuario, reserva, agora=None):
    if not (usuario and usuario.is_authenticated and usuario_e_dono_ou_admin(usuario, reserva)):
        raise PermissionDenied('Apenas o responsável ou um administrador pode gerenciar esta reserva.')
    if reserva.status == StatusReserva.CANCELADA:
        raise ValidationError({'status': 'Esta reserva já está cancelada.'})
    if reserva.status not in STATUS_RESERVAS_ABERTAS:
        raise ValidationError({'status': 'Esta reserva não pode mais ser alterada ou cancelada.'})
    inicio, _ = intervalo_reserva(reserva)
    if not usuario_e_admin(usuario) and (agora or timezone.now()) > inicio - PRAZO_GERENCIAMENTO:
        raise ValidationError({'detail': 'O prazo para alterar ou cancelar encerra uma hora antes da saída.'})


def validar_cancelamento(usuario, reserva, agora=None):
    validar_gerenciamento(usuario, reserva, agora)


def validar_autorizacao(usuario, dados):
    if not pode_reservar(
        usuario, TipoRecursoReservavel.VEICULO,
        data=dados['data'], data_fim=dados['data_devolucao_prevista'],
    ):
        raise PermissionDenied('Você não tem autorização para reservar veículo durante todo esse período.')


def reservas_bloqueantes(veiculo):
    return ReservaVeiculo.objects.filter(veiculo=veiculo).exclude(
        status__in=STATUS_RESERVAS_FINAIS,
    ).order_by('data', 'horario_inicio')


def _validar_ocupacao(veiculo, inicio, fim, reserva=None):
    if veiculo.status != StatusRecurso.ATIVO:
        raise ValidationError({'veiculo': 'O veículo não está disponível para reserva.'})
    reservas = reservas_bloqueantes(veiculo)
    if reserva is not None:
        reservas = reservas.exclude(pk=reserva.pk)
    for existente in reservas:
        retirada, retorno = intervalo_reserva(existente)
        if inicio < retorno + MARGEM_ENTRE_RESERVAS and fim > retirada - MARGEM_ENTRE_RESERVAS:
            raise ValidationError({'veiculo': 'O veículo está ocupado ou não há uma hora de intervalo entre as reservas.'})


def validar_disponibilidade(dados, reserva=None, usuario=None, agora=None):
    if reserva is not None:
        validar_gerenciamento(usuario, reserva, agora)
    inicio, fim = validar_intervalo(dados)
    _validar_ocupacao(dados['veiculo'], inicio, fim, reserva)


def validar_reserva(usuario, dados, reserva=None, agora=None):

    if reserva is not None:
        campos = ('veiculo', 'data', 'data_devolucao_prevista', 'horario_inicio',
                  'horario_fim', 'quantidade_passageiros')
        dados = {campo: dados.get(campo, getattr(reserva, campo)) for campo in campos}
    agora = agora or timezone.now()
    if reserva is not None:

        validar_gerenciamento(usuario, reserva, agora)
    inicio, fim = validar_intervalo(dados)
    if reserva is None and inicio <= agora:
        raise ValidationError({'data': 'A saída deve ser futura.'})
    if reserva is not None and not usuario_e_admin(usuario) and inicio < agora + PRAZO_GERENCIAMENTO:
        raise ValidationError({'data': 'A nova saída deve ter pelo menos uma hora de antecedência.'})
    quantidade = dados['quantidade_passageiros']
    if quantidade > dados['veiculo'].capacidade:
        raise ValidationError({'quantidade_passageiros': 'A quantidade de ocupantes, incluindo o motorista, não pode exceder a capacidade do veículo.'})
    validar_autorizacao(reserva.usuario if reserva is not None else usuario, dados)
    _validar_ocupacao(dados['veiculo'], inicio, fim, reserva)
