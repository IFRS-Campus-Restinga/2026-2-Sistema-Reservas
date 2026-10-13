from datetime import datetime
from io import BytesIO
from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone
from pypdf import PdfReader
from rest_framework.exceptions import PermissionDenied, ValidationError

from api.enumerations import StatusReserva
from api.enumerations.status_termo import StatusTermo
from api.models import Reserva, TermoResponsabilidade
from api.permissions.regras_comuns import usuario_e_admin


ABERTAS = (StatusReserva.AGUARDANDO_TERMO, StatusReserva.PENDENTE)
MODELOS = Path(__file__).resolve().parent.parent / 'templates' / 'termos'


def reserva_concreta(reserva):
    if hasattr(reserva, 'reservaveiculo'):
        return reserva.reservaveiculo, 'veiculo'
    if hasattr(reserva, 'reservarecursogeral'):
        return reserva.reservarecursogeral, 'recurso_geral'
    raise ValidationError('Esta modalidade não possui termo de responsabilidade.')


def reserva_exige_termo(reserva, recurso=None):
    concreta, modalidade = reserva_concreta(reserva)
    if modalidade == 'veiculo':
        return True
    if recurso is not None:
        item = recurso
    else:
        item = concreta.recurso_geral
    return item.tem_termo_de_responsabilidade


def modelo_da_reserva(reserva):
    _, modalidade = reserva_concreta(reserva)
    if modalidade == 'veiculo':
        nome = 'termo-veiculos.docx'
    else:
        nome = 'termo-recursos.docx'
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


def resumo_termo(reserva, usuario):
    termos = list(reserva.termos.select_related('enviado_por', 'validado_por').all())
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

    return {
        'reserva': reserva.pk, 'status_reserva': reserva.status,
        'status': status,
        'url_modelo': f'/api/reservas/{reserva.pk}/termo/modelo/',
        'atual': termo_atual,
        'historico': [dados(termo) for termo in termos if not termo.atual],
        'limite_bytes': settings.TERMO_MAX_UPLOAD_BYTES,
        'pode_enviar': (
            reserva.usuario_id == usuario.pk and pode_receber_termo(reserva)
            and (atual is None or atual.status == StatusTermo.REJEITADO)
        ),
        'pode_analisar': bool(
            usuario_e_admin(usuario) and atual and atual.status == StatusTermo.PENDENTE
            and pode_receber_termo(reserva)
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


def enviar_termo(reserva, usuario, arquivo):
    if reserva.usuario_id != usuario.pk:
        raise PermissionDenied('Somente o responsável pela reserva pode enviar o termo.')
    validar_reserva_aberta(reserva)
    validar_pdf(arquivo)
    atual = reserva.termos.filter(atual=True).first()
    if atual and atual.status != StatusTermo.REJEITADO:
        raise ValidationError('Já existe um termo em análise ou aprovado para esta reserva.')
    modelo = modelo_da_reserva(reserva)
    termo = TermoResponsabilidade(reserva=reserva, enviado_por=usuario, nome_original=arquivo.name)
    try:
        with transaction.atomic():
            reserva.termos.filter(atual=True).update(atual=False)
            termo.arquivo_original.save(modelo.name, ContentFile(modelo.read_bytes()), save=False)
            termo.arquivo_assinado.save(arquivo.name, arquivo, save=False)
            termo.save()
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
    exige_termo = reserva_exige_termo(reserva, recurso=dados.get('recurso_geral'))
    if exige_termo:
        reserva.status = StatusReserva.AGUARDANDO_TERMO
    else:
        reserva.status = StatusReserva.PENDENTE
    reserva.save(update_fields=['status'])


def analisar_termo(reserva, termo_id, usuario, decisao, motivo):
    if not usuario_e_admin(usuario):
        raise PermissionDenied('Somente administradores podem analisar termos.')
    validar_reserva_aberta(reserva)
    termo = reserva.termos.filter(pk=termo_id, atual=True).first()
    if not termo or termo.status != StatusTermo.PENDENTE:
        raise ValidationError('Este termo já foi analisado ou substituído. Atualize a solicitação.')
    if decisao == StatusTermo.APROVADO:
        concreta, modalidade = reserva_concreta(reserva)
        if modalidade == 'veiculo':
            from api.models import Veiculo
            from api.services.reserva_veiculo_service import validar_reserva
            concreta.veiculo = Veiculo.objects.select_for_update().get(pk=concreta.veiculo_id)
            validar_reserva(usuario, {}, concreta)
        else:
            from api.models import RecursoGeral
            from api.validators.reserva_recurso_geral_validator import validar_autorizacao, validar_disponibilidade
            concreta.recurso_geral = RecursoGeral.objects.select_for_update().get(pk=concreta.recurso_geral_id)
            dados = {campo: getattr(concreta, campo) for campo in (
                'recurso_geral', 'data', 'data_devolucao_prevista', 'horario_inicio', 'horario_fim', 'quantidades',
            )}
            validar_autorizacao(concreta.usuario, dados)
            validar_disponibilidade(dados, excluir_reserva=concreta.pk)
        novo_status = StatusReserva.CONFIRMADA
    else:
        novo_status = StatusReserva.AGUARDANDO_TERMO
    termo.status = decisao
    termo.validado_por = usuario
    termo.data_validacao = timezone.now()
    if decisao == StatusTermo.REJEITADO:
        termo.motivo_rejeicao = motivo
    else:
        termo.motivo_rejeicao = ''
    termo.save(update_fields=['status', 'validado_por', 'data_validacao', 'motivo_rejeicao'])
    reserva.status = novo_status
    Reserva.objects.filter(pk=reserva.pk).update(status=reserva.status)
