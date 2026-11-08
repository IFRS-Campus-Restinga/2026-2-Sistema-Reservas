import calendar
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Callable
from django.db.models import Q
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError
from api.enumerations import StatusRecurso, StatusReserva, TipoRecorrencia
from api.enumerations.auditoria_enumerations import EntidadeAuditoria
from api.models.area_model import Area
from api.models.recorrencia_model import Recorrencia
from api.models.reserva_area_model import ReservaArea
from api.models.reserva_veiculo_model import ReservaVeiculo
from api.models.veiculo_model import Veiculo
from api.permissions.regras_comuns import usuario_e_admin
from api.serializers.recorrencia_serializer import RecorrenciaSerializer
from api.serializers.reserva_area_serializer import ReservaAreaSerializer
from api.serializers.reserva_veiculo_serializer import ReservaVeiculoSerializer
from api.services.auditoria import foto
from api.services.reserva_veiculo_service import (
    MARGEM_ENTRE_RESERVAS,
    PRAZO_GERENCIAMENTO,
    instante,
    validar_reserva,
)
from api.services.termo_service import invalidar_termo_apos_edicao
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


@dataclass(frozen=True)
class ModalidadeRecorrencia:
    modelo: type
    serializer: type
    campo_recurso: str
    modelo_recurso: type
    campos_disponibilidade: tuple
    campos_edicao: frozenset
    select_related: tuple
    entidade_auditoria: str
    validar_previa: Callable
    validar_ocorrencia: Callable
    antecedencia: Callable = lambda usuario: timedelta(0)
    apos_edicao: Callable = lambda reserva, dados: None
    campos_criacao: dict = field(default_factory=dict)
    margem_entre_ocorrencias: timedelta | None = None
    status_alteraveis: tuple = (StatusReserva.PENDENTE, StatusReserva.CONFIRMADA)


def _validar_ocorrencia_area(ator, dados, reserva=None, excluir_ids=()):
    validar_autorizacao(reserva.usuario if reserva is not None else ator, dados)
    validar_disponibilidade_area(dados, excluir_reserva=reserva.pk if reserva is not None else None)


def _validar_previa_veiculo(dados):
    veiculo = dados["veiculo"]

    if veiculo.status != StatusRecurso.ATIVO:
        raise ValidationError({"veiculo": "O veículo não está disponível para reserva."})

    if dados["quantidade_passageiros"] > veiculo.capacidade:
        raise ValidationError({
            "quantidade_passageiros": (
                "A quantidade de ocupantes, incluindo o motorista, "
                "não pode exceder a capacidade do veículo."
            )
        })


def _validar_ocorrencia_veiculo(ator, dados, reserva=None, excluir_ids=()):
    validar_reserva(ator, dados, reserva, excluir_ids=excluir_ids)


RECORRENCIA_AREA = ModalidadeRecorrencia(
    modelo=ReservaArea,
    serializer=ReservaAreaSerializer,
    campo_recurso="area",
    modelo_recurso=Area,
    campos_disponibilidade=("area", "data", "horario_inicio", "horario_fim"),
    campos_edicao=frozenset({"nome", "descricao", "horario_inicio", "horario_fim", "area", "aula"}),
    select_related=("area__bloco", "usuario", "recorrencia"),
    entidade_auditoria=EntidadeAuditoria.RECORRENCIA_RESERVA_AREA,
    validar_previa=lambda dados: validar_area_ativa(dados["area"]),
    validar_ocorrencia=_validar_ocorrencia_area,
    campos_criacao={"status": StatusReserva.CONFIRMADA},
)

RECORRENCIA_VEICULO = ModalidadeRecorrencia(
    modelo=ReservaVeiculo,
    serializer=ReservaVeiculoSerializer,
    campo_recurso="veiculo",
    modelo_recurso=Veiculo,
    campos_disponibilidade=(
        "veiculo", "data", "data_devolucao_prevista", "horario_inicio",
        "horario_fim", "quantidade_passageiros",
    ),
    campos_edicao=frozenset({
        "nome", "descricao", "horario_inicio", "horario_fim", "veiculo",
        "destino", "finalidade", "quantidade_passageiros",
    }),
    select_related=("veiculo", "usuario", "recorrencia"),
    entidade_auditoria=EntidadeAuditoria.RECORRENCIA_RESERVA_VEICULO,
    validar_previa=_validar_previa_veiculo,
    validar_ocorrencia=_validar_ocorrencia_veiculo,
    antecedencia=lambda usuario: timedelta(0) if usuario_e_admin(usuario) else PRAZO_GERENCIAMENTO,
    apos_edicao=invalidar_termo_apos_edicao,
    margem_entre_ocorrencias=MARGEM_ENTRE_RESERVAS,
)


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


def ocorrencias_da_serie(dados, datas):
    duracao = (
        dados["data_devolucao_prevista"] - dados["data"]
        if "data_devolucao_prevista" in dados
        else None
    )
    ocorrencias = []

    for data in datas:
        ocorrencia = {**dados, "data": data}

        if duracao is not None:
            ocorrencia["data_devolucao_prevista"] = data + duracao

        ocorrencias.append(ocorrencia)

    return ocorrencias


def _validar_intervalo_entre_ocorrencias(modalidade, ocorrencias):
    margem = modalidade.margem_entre_ocorrencias

    if margem is None:
        return

    intervalos = sorted(
        (
            instante(dados["data"], dados["horario_inicio"]),
            instante(dados.get("data_devolucao_prevista", dados["data"]), dados["horario_fim"]),
        )
        for dados in ocorrencias
    )

    for (_, fim), (inicio, _) in zip(intervalos, intervalos[1:]):
        if inicio < fim + margem:
            raise ValidationError({
                "recorrencia": (
                    "A duração da reserva não cabe no intervalo da recorrência: "
                    "cada saída precisa ocorrer pelo menos 1 hora após o retorno anterior."
                )
            })


def filtro_reservas_futuras(antecedencia=timedelta(0)):
    limite = timezone.localtime() + antecedencia

    return Q(data__gt=limite.date()) | Q(
        data=limite.date(),
        horario_inicio__gt=limite.time().replace(tzinfo=None),
    )


def reservas_alteraveis(modalidade, recorrencia, usuario=None):
    antecedencia = modalidade.antecedencia(usuario) if usuario is not None else timedelta(0)

    return (
        modalidade.modelo.objects.filter(
            recorrencia=recorrencia,
            status__in=modalidade.status_alteraveis,
        )
        .filter(filtro_reservas_futuras(antecedencia))
        .order_by("data", "horario_inicio")
    )


def serializar_recorrencia(modalidade, recorrencia, usuario=None):
    reservas = (
        modalidade.modelo.objects.filter(recorrencia=recorrencia)
        .select_related(*modalidade.select_related)
        .order_by("data", "horario_inicio")
    )

    return {
        "recorrencia": RecorrenciaSerializer(recorrencia).data,
        "reservas": modalidade.serializer(reservas, many=True).data,
        "alteraveis": list(
            reservas_alteraveis(modalidade, recorrencia, usuario).values_list("pk", flat=True)
        ),
    }


def _mensagem_erro(erro):
    detalhe = erro.detail

    if isinstance(detalhe, dict):
        detalhe = next(iter(detalhe.values()))

    if isinstance(detalhe, list):
        detalhe = detalhe[0]

    return str(detalhe)


def _conflitos_ocorrencias(modalidade, ator, ocorrencias, excluir_ids=()):
    conflitos = []

    for dados, reserva in ocorrencias:
        try:
            modalidade.validar_ocorrencia(ator, dados, reserva, excluir_ids)
        except (PermissionDenied, ValidationError) as erro:
            conflitos.append((dados["data"], _mensagem_erro(erro)))

    return conflitos


def _erro_conflitos(conflitos):
    return ValidationError({
        "recorrencia": [f"{data:%d/%m/%Y}: {mensagem}" for data, mensagem in conflitos],
        "datas_conflitantes": [data.isoformat() for data, _ in conflitos],
    })


def criar_reservas_recorrentes(modalidade, usuario, dados, dados_recorrencia):
    datas = gerar_datas(dados_recorrencia["tipo"], dados["data"], dados_recorrencia["data_fim"])

    if len(datas) < 2:
        raise ValidationError({
            "recorrencia": "O período informado deve gerar pelo menos duas reservas."
        })

    modalidade.validar_previa(dados)
    ocorrencias = ocorrencias_da_serie(dados, datas)
    _validar_intervalo_entre_ocorrencias(modalidade, ocorrencias)
    conflitos = _conflitos_ocorrencias(modalidade, usuario, [(ocorrencia, None) for ocorrencia in ocorrencias])

    if conflitos and not dados_recorrencia.get("pular_conflitos"):
        raise _erro_conflitos(conflitos)

    datas_puladas = [data for data, _ in conflitos]
    ocorrencias_reservadas = [
        ocorrencia for ocorrencia in ocorrencias if ocorrencia["data"] not in datas_puladas
    ]

    if len(ocorrencias_reservadas) < 2:
        raise ValidationError({
            "recorrencia": (
                f"Restariam apenas {len(ocorrencias_reservadas)} reserva(s) após pular as datas em conflito."
            )
        })

    recorrencia = Recorrencia.objects.create(
        tipo=dados_recorrencia["tipo"],
        data_inicio=datas[0],
        data_fim=dados_recorrencia["data_fim"],
        usuario=usuario,
    )

    for ocorrencia in ocorrencias_reservadas:
        modalidade.modelo.objects.create(
            **ocorrencia,
            **modalidade.campos_criacao,
            usuario=usuario,
            recorrencia=recorrencia,
        )

    return recorrencia, datas_puladas


def editar_recorrencia(modalidade, recorrencia, ator, dados_edicao):
    reservas = list(reservas_alteraveis(modalidade, recorrencia, ator).select_for_update())

    if not reservas:
        raise ValidationError({
            "detail": "Não há reservas futuras alteráveis nesta recorrência."
        })

    serializers = []

    for reserva in reservas:
        serializer = modalidade.serializer(reserva, data=dados_edicao, partial=True)
        serializer.is_valid(raise_exception=True)
        serializers.append(serializer)

    campo = modalidade.campo_recurso
    ids_recursos = {getattr(reserva, f"{campo}_id") for reserva in reservas}
    ids_recursos.update(
        serializer.validated_data[campo].pk
        for serializer in serializers
        if campo in serializer.validated_data
    )

    recursos = {
        recurso.pk: recurso
        for recurso in modalidade.modelo_recurso.objects.select_for_update()
        .filter(pk__in=ids_recursos)
        .order_by("pk")
    }

    ocorrencias = []

    for serializer in serializers:
        reserva = serializer.instance
        dados = {nome: getattr(reserva, nome) for nome in modalidade.campos_disponibilidade}
        dados.update(serializer.validated_data)
        dados[campo] = recursos[dados[campo].pk]

        if campo in serializer.validated_data:
            serializer.validated_data[campo] = dados[campo]

        ocorrencias.append((dados, reserva))

    for dados, _ in ocorrencias:
        modalidade.validar_previa(dados)

    _validar_intervalo_entre_ocorrencias(modalidade, [dados for dados, _ in ocorrencias])

    # As ocorrências editadas são validadas com os novos horários, sem conflitar entre si
    excluir_ids = [reserva.pk for reserva in reservas]
    conflitos = _conflitos_ocorrencias(modalidade, ator, ocorrencias, excluir_ids)

    if conflitos:
        raise _erro_conflitos(conflitos)

    alteradas = []

    for serializer in serializers:
        antes = foto(serializer.instance)
        modalidade.apos_edicao(serializer.instance, serializer.validated_data)
        serializer.save()
        alteradas.append((serializer.instance, antes))

    return alteradas


def cancelar_recorrencia(modalidade, recorrencia, usuario):
    reservas = list(reservas_alteraveis(modalidade, recorrencia, usuario).select_for_update())

    if not reservas:
        raise ValidationError({
            "detail": "Não há reservas futuras alteráveis nesta recorrência."
        })

    canceladas = []

    for reserva in reservas:
        antes = foto(reserva)
        reserva.status = StatusReserva.CANCELADA
        reserva.save(update_fields=["status"])
        canceladas.append((reserva, antes))

    return canceladas
