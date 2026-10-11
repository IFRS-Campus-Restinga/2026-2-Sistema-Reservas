import calendar
from datetime import date, timedelta
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError
from api.enumerations import StatusReserva, TipoRecorrencia
from api.models.area_model import Area
from api.models.recorrencia_model import Recorrencia
from api.models.reserva_area_model import ReservaArea
from api.serializers.reserva_area_serializer import ReservaAreaSerializer
from api.validators.reserva_area_validator import (
    validar_area_ativa,
    validar_autorizacao,
    validar_disponibilidade_area,
)

INTERVALO_DIAS = {
    TipoRecorrencia.DIARIA: 1,
    TipoRecorrencia.SEMANAL: 7,
    TipoRecorrencia.QUINZENAL: 14,
}

CAMPOS_DISPONIBILIDADE = ("area", "data", "horario_inicio", "horario_fim")


def gerar_datas(tipo, data_inicio, data_fim):
    if tipo == TipoRecorrencia.MENSAL:
        return _gerar_datas_mensais(data_inicio, data_fim)

    passo = timedelta(days=INTERVALO_DIAS[tipo])
    datas = []
    data = data_inicio

    while data <= data_fim:
        datas.append(data)
        data += passo

    return datas


def _gerar_datas_mensais(data_inicio, data_fim):
    datas = []
    meses = 0

    while True:
        ano, mes = divmod(data_inicio.month - 1 + meses, 12)
        ano += data_inicio.year
        mes += 1
        dia = min(data_inicio.day, calendar.monthrange(ano, mes)[1])
        data = date(ano, mes, dia)

        if data > data_fim:
            return datas

        datas.append(data)
        meses += 1


def filtro_reservas_futuras():
    agora = timezone.localtime()

    return Q(data__gt=agora.date()) | Q(
        data=agora.date(),
        horario_inicio__gt=agora.time().replace(tzinfo=None),
    )


def reservas_alteraveis(recorrencia):
    return (
        ReservaArea.objects.filter(
            recorrencia=recorrencia,
            status=StatusReserva.CONFIRMADA,
        )
        .filter(filtro_reservas_futuras())
        .order_by("data", "horario_inicio")
    )


def _mensagem_erro(erro):
    detalhe = erro.detail

    if isinstance(detalhe, dict):
        detalhe = next(iter(detalhe.values()))

    if isinstance(detalhe, list):
        detalhe = detalhe[0]

    return str(detalhe)


def _validar_ocorrencias(usuario, ocorrencias):
    conflitos = []

    for dados, excluir_reserva in ocorrencias:
        try:
            validar_autorizacao(usuario, dados)
            validar_disponibilidade_area(dados, excluir_reserva=excluir_reserva)
        except (PermissionDenied, ValidationError) as erro:
            conflitos.append(f"{dados['data']:%d/%m/%Y}: {_mensagem_erro(erro)}")

    if conflitos:
        raise ValidationError({"recorrencia": conflitos})


def criar_reservas_recorrentes(usuario, dados, dados_recorrencia):
    datas = gerar_datas(dados_recorrencia["tipo"], dados["data"], dados_recorrencia["data_fim"])

    if len(datas) < 2:
        raise ValidationError({
            "recorrencia": "O período informado deve gerar pelo menos duas reservas."
        })

    validar_area_ativa(dados["area"])
    _validar_ocorrencias(usuario, [({**dados, "data": data}, None) for data in datas])

    recorrencia = Recorrencia.objects.create(
        tipo=dados_recorrencia["tipo"],
        data_inicio=datas[0],
        data_fim=dados_recorrencia["data_fim"],
        usuario=usuario,
    )

    for data in datas:
        ReservaArea.objects.create(
            **{**dados, "data": data},
            usuario=usuario,
            status=StatusReserva.CONFIRMADA,
            recorrencia=recorrencia,
        )

    return recorrencia


def editar_recorrencia(recorrencia, dados_edicao):
    reservas = list(reservas_alteraveis(recorrencia).select_for_update())

    if not reservas:
        raise ValidationError({
            "detail": "Não há reservas futuras confirmadas nesta recorrência."
        })

    serializers = []

    for reserva in reservas:
        serializer = ReservaAreaSerializer(reserva, data=dados_edicao, partial=True)
        serializer.is_valid(raise_exception=True)
        serializers.append(serializer)

    ids_areas = {reserva.area_id for reserva in reservas}
    ids_areas.update(
        serializer.validated_data["area"].pk
        for serializer in serializers
        if "area" in serializer.validated_data
    )

    areas = {
        area.pk: area
        for area in Area.objects.select_for_update()
        .filter(pk__in=ids_areas)
        .order_by("pk")
    }

    ocorrencias = []

    for serializer in serializers:
        reserva = serializer.instance
        dados = {campo: getattr(reserva, campo) for campo in CAMPOS_DISPONIBILIDADE}
        dados.update(serializer.validated_data)
        dados["area"] = areas[dados["area"].pk]

        if "area" in serializer.validated_data:
            serializer.validated_data["area"] = dados["area"]

        ocorrencias.append((dados, reserva.pk))

    for area_id in {dados["area"].pk for dados, _ in ocorrencias}:
        validar_area_ativa(areas[area_id])

    _validar_ocorrencias(recorrencia.usuario, ocorrencias)

    for serializer in serializers:
        serializer.save()


def cancelar_recorrencia(recorrencia):
    reservas = list(reservas_alteraveis(recorrencia).select_for_update())

    if not reservas:
        raise ValidationError({
            "detail": "Não há reservas futuras confirmadas nesta recorrência."
        })

    for reserva in reservas:
        reserva.status = StatusReserva.CANCELADA
        reserva.save(update_fields=["status"])
