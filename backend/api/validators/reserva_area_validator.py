from datetime import datetime
from rest_framework.exceptions import PermissionDenied, ValidationError
from api.enumerations import StatusReserva
from api.enumerations.area_enumerations.area_enums import StatusRecurso
from api.enumerations.tipo_recurso_reservavel import TipoRecursoReservavel
from api.models.reserva_area_model import ReservaArea
from api.permissions.regras_reserva import pode_reservar


def validar_autorizacao(usuario, dados):
    autorizado = pode_reservar(
        usuario,
        TipoRecursoReservavel.AREA,
        data=dados["data"],
    )
    if not autorizado:
        raise PermissionDenied(
            "Você não tem autorização para reservar essa área nesse período."
        )


def validar_disponibilidade_area(dados, excluir_reserva=None):
    area = dados["area"]

    if area.status != StatusRecurso.ATIVO:
        raise ValidationError({"area": "A área não está ativa para reservas."})

    if not area.disponibilidade:
        raise ValidationError({"area": "A área não está disponível para reservas no momento."})

    inicio = datetime.combine(dados["data"], dados["horario_inicio"])
    fim = datetime.combine(dados["data"], dados["horario_fim"])

    status_ativos = [StatusReserva.PENDENTE, StatusReserva.CONFIRMADA]

    reservas = ReservaArea.objects.filter(
        area=area,
        status__in=status_ativos,
        data=dados["data"],
    )

    if excluir_reserva is not None:
        reservas = reservas.exclude(pk=excluir_reserva)

    for reserva in reservas:
        inicio_reserva = datetime.combine(reserva.data, reserva.horario_inicio)
        fim_reserva = datetime.combine(reserva.data, reserva.horario_fim)

        if inicio < fim_reserva and fim > inicio_reserva:
            raise ValidationError(
                {"horario_inicio": "Já existe uma reserva nesse período para essa área."}
            )
