from datetime import datetime, timedelta
from io import BytesIO
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
from pypdf import PdfReader
from rest_framework.exceptions import PermissionDenied, ValidationError

from api.enumerations import StatusReserva, TipoTermo
from api.enumerations.status_termo import StatusTermo
from api.models import Reserva, TermoResponsabilidade
from api.permissions.regras_comuns import usuario_e_admin
from api.services.situacao_reserva_service import situacao_reserva
from api.services.notificacao_service import criar_notificacao_termo_aprovado, criar_notificacao_termo_enviado, criar_notificacao_termo_rejeitado


ABERTAS = (StatusReserva.AGUARDANDO_TERMO, StatusReserva.PENDENTE)
MODELOS = Path(__file__).resolve().parent.parent / 'documentos' / 'termos'

MODELOS_POR_TIPO = {
    TipoTermo.RESPONSABILIDADE: {'recurso_geral': 'termo-recursos.docx'},
    TipoTermo.RETIRADA_VEICULO: {'veiculo': 'termo-retirada-veiculo.docx'},
    TipoTermo.DEVOLUCAO_VEICULO: {'veiculo': 'termo-devolucao-veiculo.docx'},
}


def reserva_concreta(reserva):
    if hasattr(reserva, 'reservaarea'):
        return reserva.reservaarea, 'area'
    if hasattr(reserva, 'reservaveiculo'):
        return reserva.reservaveiculo, 'veiculo'
    if hasattr(reserva, 'reservarecursogeral'):
        return reserva.reservarecursogeral, 'recurso_geral'
    raise ValidationError('Não foi possível identificar a modalidade da reserva.')


def reserva_exige_termo(reserva, recurso=None):
    concreta, modalidade = reserva_concreta(reserva)
    if modalidade == 'area':
        return False
    if modalidade == 'veiculo':
        return False
    if recurso is not None:
        item = recurso
    else:
        item = concreta.recurso_geral
    return item.tem_termo_de_responsabilidade


def modelo_da_reserva(reserva, tipo=TipoTermo.RESPONSABILIDADE):
    _, modalidade = reserva_concreta(reserva)
    nome = MODELOS_POR_TIPO.get(tipo, {}).get(modalidade)
    if nome is None:
        raise ValidationError('Este tipo de termo não está disponível para a reserva.')
    caminho = MODELOS / nome
    if not caminho.is_file():
        raise ValidationError('O modelo de termo está indisponível. Entre em contato com a administração.')
    return caminho


def pode_receber_termo(reserva):
    inicio = timezone.make_aware(datetime.combine(reserva.data, reserva.horario_inicio))
    return reserva_exige_termo(reserva) and reserva.status in ABERTAS and inicio > timezone.now()


def validar_reserva_aberta(reserva):
    if not pode_receber_termo(reserva):
        raise ValidationError('Esta reserva não aceita envio ou aprovação de termo.')


def resumo_termo(reserva, usuario, tipo=TipoTermo.RESPONSABILIDADE):
    termos = list(reserva.termos.filter(tipo=tipo).select_related('enviado_por', 'validado_por').all())
    atual = next((termo for termo in termos if termo.atual), None)

    def dados(termo):
        validado_por = None
        if termo.validado_por:
            validado_por = termo.validado_por.nome or termo.validado_por.email
        return {
            'id': termo.pk,
            'nome_original': termo.nome_original, 'status': termo.status,
            'atual': termo.atual, 'data_envio': termo.data_envio,
            'data_validacao': termo.data_validacao,
            'enviado_por': termo.enviado_por.nome or termo.enviado_por.email,
            'validado_por': validado_por,
            'motivo_rejeicao': termo.motivo_rejeicao,
            'url_arquivo': f'/api/termos/{termo.pk}/arquivo/',
            'url_modelo': f'/api/termos/{termo.pk}/modelo/',
        }

    status = StatusTermo.PENDENTE
    termo_atual = None
    if atual:
        status = atual.status
        termo_atual = dados(atual)

    if tipo == TipoTermo.RESPONSABILIDADE:
        url_modelo = f'/api/reservas/{reserva.pk}/termo/modelo/'
    else:
        nome_tipo = 'retirada' if tipo == TipoTermo.RETIRADA_VEICULO else 'devolucao'
        url_modelo = f'/api/reservas/{reserva.pk}/termo-operacional/{nome_tipo}/modelo/'

    if tipo == TipoTermo.RESPONSABILIDADE:
        pode_operar = pode_receber_termo(reserva)
    else:
        try:
            validar_termo_operacional(reserva, tipo)
            pode_operar = True
        except ValidationError:
            pode_operar = False

    return {
        'reserva': reserva.pk, 'status_reserva': reserva.status,
        'status': status,
        'url_modelo': url_modelo,
        'atual': termo_atual,
        'historico': [dados(termo) for termo in termos if not termo.atual],
        'limite_bytes': settings.TERMO_MAX_UPLOAD_BYTES,
        'pode_enviar': (
            reserva.usuario_id == usuario.pk and pode_operar
            and (atual is None or atual.status == StatusTermo.REJEITADO)
        ),
        'pode_analisar': bool(
            usuario_e_admin(usuario) and atual and atual.status == StatusTermo.PENDENTE and pode_operar
        ),
    }


def validar_pdf(arquivo):
    if arquivo is None:
        raise ValidationError({'arquivo': 'Selecione o documento assinado.'})
    if not arquivo.size or arquivo.size > settings.TERMO_MAX_UPLOAD_BYTES:
        raise ValidationError({'arquivo': 'Envie um arquivo não vazio dentro do limite de tamanho.'})
    if Path(arquivo.name).suffix.lower() != '.pdf':
        raise ValidationError({'arquivo': 'O documento assinado deve estar em PDF.'})
    conteudo = arquivo.read()
    arquivo.seek(0)
    try:
        if not conteudo.startswith(b'%PDF-'):
            raise ValueError('Cabeçalho inválido')
        pdf = PdfReader(BytesIO(conteudo))
        if pdf.is_encrypted or len(pdf.pages) == 0:
            raise ValueError('PDF protegido ou sem páginas')
    except Exception as erro:
        raise ValidationError({'arquivo': 'Envie um PDF válido, com páginas e sem senha.'}) from erro


def enviar_termo(reserva, usuario, arquivo, tipo=TipoTermo.RESPONSABILIDADE):
    if reserva.usuario_id != usuario.pk:
        raise PermissionDenied('Somente o responsável pela reserva pode enviar o termo.')
    if tipo == TipoTermo.RESPONSABILIDADE:
        validar_reserva_aberta(reserva)
    else:
        validar_termo_operacional(reserva, tipo)
    validar_pdf(arquivo)
    atual = reserva.termos.filter(tipo=tipo, atual=True).first()
    reenviado = bool(atual and atual.status == StatusTermo.REJEITADO)
    if atual and atual.status != StatusTermo.REJEITADO:
        raise ValidationError('Já existe um termo em análise ou aprovado para esta reserva.')
    modelo = modelo_da_reserva(reserva, tipo)
    termo = TermoResponsabilidade(reserva=reserva, tipo=tipo, enviado_por=usuario, nome_original=arquivo.name)
    try:
        with transaction.atomic():
            reserva.termos.filter(tipo=tipo, atual=True).update(atual=False)
            termo.arquivo_original.save(modelo.name, ContentFile(modelo.read_bytes()), save=False)
            termo.arquivo_assinado.save(arquivo.name, arquivo, save=False)
            termo.save()
            if tipo == TipoTermo.RESPONSABILIDADE:
                criar_notificacao_termo_enviado(
                    termo,
                    reenviado=reenviado,
                )
                reserva.status = StatusReserva.PENDENTE
                Reserva.objects.filter(pk=reserva.pk).update(status=reserva.status)
    except Exception:
        for campo in (termo.arquivo_original, termo.arquivo_assinado):
            if campo.name:
                campo.delete(save=False)
        raise
    return termo


def invalidar_termo_apos_edicao(reserva, dados):
    campos = ('veiculo', 'recurso_geral', 'data', 'data_devolucao_prevista',
              'horario_inicio', 'horario_fim', 'quantidades', 'quantidade_passageiros',
              'destino', 'finalidade')
    if not any(campo in dados and dados[campo] != getattr(reserva, campo, None) for campo in campos):
        return
    reserva.termos.filter(atual=True).update(atual=False)
    _, modalidade = reserva_concreta(reserva)

    if modalidade == 'veiculo':
        reserva.status = StatusReserva.PENDENTE
    else:
        exige_termo = reserva_exige_termo(
            reserva,
            recurso=dados.get('recurso_geral'),
        )

        if exige_termo:
            reserva.status = StatusReserva.AGUARDANDO_TERMO
        else:
            reserva.status = StatusReserva.CONFIRMADA
    reserva.save(update_fields=['status'])


def validar_termo_operacional(reserva, tipo):
    concreta, modalidade = reserva_concreta(reserva)
    if modalidade != 'veiculo':
        raise ValidationError('Este termo está disponível apenas para reservas de veículos.')
    if reserva.status in (StatusReserva.CANCELADA, StatusReserva.REJEITADA):
        raise ValidationError('A reserva não aceita documentos operacionais neste estado.')
    if tipo == TipoTermo.RETIRADA_VEICULO and reserva.status != StatusReserva.CONFIRMADA:
        raise ValidationError('A retirada só pode ser enviada após a confirmação da reserva.')
    if tipo == TipoTermo.RETIRADA_VEICULO:
        inicio = timezone.make_aware(
            datetime.combine(reserva.data, reserva.horario_inicio),
            timezone.get_current_timezone(),
        )
        if timezone.now() < inicio - timedelta(hours=1):
            raise ValidationError('O termo de retirada fica disponível uma hora antes do início da reserva.')
    if tipo == TipoTermo.DEVOLUCAO_VEICULO:
        if (reserva.status != StatusReserva.AGUARDANDO_TERMO_DEVOLUCAO):
            raise ValidationError('A devolução só pode ser enviada após a aprovação da retirada.')
        retirada = reserva.termos.filter(tipo=TipoTermo.RETIRADA_VEICULO, atual=True).first()
        if not retirada or retirada.status != StatusTermo.APROVADO:
            raise ValidationError('A devolução só pode ser enviada após a aprovação da retirada.')


def analisar_termo(reserva, termo_id, usuario, decisao, motivo, tipo=TipoTermo.RESPONSABILIDADE):
    if not usuario_e_admin(usuario):
        raise PermissionDenied('Somente administradores podem analisar termos.')
    if tipo == TipoTermo.RESPONSABILIDADE:
        validar_reserva_aberta(reserva)
    else:
        validar_termo_operacional(reserva, tipo)
    termo = reserva.termos.filter(pk=termo_id, tipo=tipo, atual=True).first()
    if not termo or termo.status != StatusTermo.PENDENTE:
        raise ValidationError('Este termo já foi analisado ou substituído. Atualize a solicitação.')
    if tipo == TipoTermo.DEVOLUCAO_VEICULO:
        retirada = reserva.termos.filter(
            tipo=TipoTermo.RETIRADA_VEICULO, atual=True, status=StatusTermo.APROVADO,
        ).first()
        if not retirada:
            raise ValidationError('A devolução só pode ser analisada após a aprovação da retirada.')
    if decisao == StatusTermo.APROVADO and tipo == TipoTermo.RESPONSABILIDADE:
        concreta, _ = reserva_concreta(reserva)
        from api.models import RecursoGeral
        from api.validators.reserva_recurso_geral_validator import validar_autorizacao, validar_disponibilidade
        concreta.recurso_geral = RecursoGeral.objects.select_for_update().get(pk=concreta.recurso_geral_id)
        dados = {campo: getattr(concreta, campo) for campo in (
            'recurso_geral', 'data', 'data_devolucao_prevista', 'horario_inicio', 'horario_fim', 'quantidades',
        )}
        validar_autorizacao(concreta.usuario, dados)
        validar_disponibilidade(dados, excluir_reserva=concreta.pk)
        novo_status = StatusReserva.CONFIRMADA
    elif tipo == TipoTermo.RESPONSABILIDADE:
        novo_status = StatusReserva.AGUARDANDO_TERMO
    elif (
        tipo == TipoTermo.RETIRADA_VEICULO
        and decisao == StatusTermo.APROVADO
    ):
        novo_status = (
            StatusReserva.AGUARDANDO_TERMO_DEVOLUCAO
        )
    elif tipo == TipoTermo.RETIRADA_VEICULO:
        novo_status = StatusReserva.CONFIRMADA
    elif decisao == StatusTermo.APROVADO and tipo == TipoTermo.DEVOLUCAO_VEICULO:
        novo_status = StatusReserva.CONCLUIDA
    elif tipo == TipoTermo.DEVOLUCAO_VEICULO:
        novo_status = StatusReserva.AGUARDANDO_TERMO_DEVOLUCAO
    termo.status = decisao
    termo.validado_por = usuario
    termo.data_validacao = timezone.now()
    if decisao == StatusTermo.REJEITADO:
        termo.motivo_rejeicao = motivo
    else:
        termo.motivo_rejeicao = ''
    termo.save(update_fields=['status', 'validado_por', 'data_validacao', 'motivo_rejeicao'])
    if tipo == TipoTermo.RESPONSABILIDADE or tipo in (TipoTermo.RETIRADA_VEICULO, TipoTermo.DEVOLUCAO_VEICULO):
        reserva.status = novo_status
        Reserva.objects.filter(pk=reserva.pk).update(
            status=reserva.status
        )

    if tipo == TipoTermo.RESPONSABILIDADE:
        if decisao == StatusTermo.APROVADO:
            criar_notificacao_termo_aprovado(reserva)

        elif decisao == StatusTermo.REJEITADO:
            criar_notificacao_termo_rejeitado(
                reserva,
                motivo,
            )

def montar_solicitacao_termo(reserva, documento_parametro):
    concreta, modalidade = reserva_concreta(reserva)

    if modalidade == 'area':
        nome_item = concreta.area.nome
    elif modalidade == 'veiculo':
        item = concreta.veiculo
        nome_item = f'{item.nome} · {item.placa}'
    else:
        item = concreta.recurso_geral
        nome_item = item.nome

    termos_atuais = getattr(reserva, 'termos_atuais', None)
    if termos_atuais is None:
        termos_atuais = list(reserva.termos.filter(atual=True))
    tipo_filtrado = {
        'responsabilidade': TipoTermo.RESPONSABILIDADE,
        'retirada': TipoTermo.RETIRADA_VEICULO,
        'devolucao': TipoTermo.DEVOLUCAO_VEICULO,
    }.get(documento_parametro)
    termos_atuais = [
        termo
        for termo in termos_atuais
        if tipo_filtrado is None or termo.tipo == tipo_filtrado
    ]

    solicitacao_reserva = (
        reserva.status == StatusReserva.PENDENTE
        and not termos_atuais
        and (modalidade != 'recurso_geral' or not concreta.recurso_geral.tem_termo_de_responsabilidade)
    )

    termo_atual = next(
        (
            termo
            for termo in termos_atuais
            if termo.status == StatusTermo.PENDENTE
        ),
        None,
    )

    if termo_atual is None:
        termo_atual = next(
            (
                termo
                for termo in termos_atuais
                if termo.tipo == TipoTermo.RESPONSABILIDADE
            ),
            None,
        )

    if termo_atual is None and termos_atuais:
        termo_atual = termos_atuais[0]

    tipo_resultado = documento_parametro

    if tipo_resultado == 'todos':
        tipo_resultado = (
            'devolucao' if reserva.status == StatusReserva.AGUARDANDO_TERMO_DEVOLUCAO
            else 'retirada' if modalidade == 'veiculo' else 'responsabilidade'
        )

    status_termo = None

    if termo_atual is not None:
        tipo_resultado = {
            TipoTermo.RESPONSABILIDADE: 'responsabilidade',
            TipoTermo.RETIRADA_VEICULO: 'retirada',
            TipoTermo.DEVOLUCAO_VEICULO: 'devolucao',
        }[termo_atual.tipo]

        status_termo = termo_atual.status

    return {
        'id': reserva.pk,
        'nome': reserva.nome,
        'descricao': reserva.descricao,
        'status': reserva.status,
        'situacao': situacao_reserva(reserva),
        'modalidade': modalidade,
        'tipo_reserva': reserva.tipo_reserva,
        'origem_solicitacao': ('RESERVA' if solicitacao_reserva else 'TERMO'),
        'data': reserva.data,
        'horario_inicio': reserva.horario_inicio,
        'horario_fim': reserva.horario_fim,
        'data_devolucao_prevista': getattr(
            concreta,
            'data_devolucao_prevista',
            reserva.data,
        ),
        'responsavel': reserva.usuario.nome or reserva.usuario.email,
        'item': nome_item,
        'destino': getattr(concreta, 'destino', ''),
        'finalidade': getattr(concreta, 'finalidade', ''),
        'quantidade': getattr(concreta, 'quantidades', None),
        'ocupantes': getattr(concreta, 'quantidade_passageiros', None),
        'termo_tipo': tipo_resultado,
        'termo_status': status_termo,
    }
