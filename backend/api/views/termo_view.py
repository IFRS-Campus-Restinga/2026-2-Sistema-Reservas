from django.db import transaction
from django.db.models import Q
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from api.enumerations import StatusReserva, TipoTermo
from api.enumerations.status_termo import StatusTermo
from api.models import Reserva, TermoResponsabilidade
from api.pagination import PaginacaoPadrao
from api.permissions.reserva_permissions import PodeGerenciarReserva
from api.permissions.regras_comuns import SomenteAdministrador
from api.serializers.termo_serializer import AnaliseTermoSerializer
from api.serializers.reserva_serializer import ReservaSerializer
from api.services.termo_service import (
    ABERTAS, analisar_termo, enviar_termo, modelo_da_reserva, reserva_concreta,
    reserva_exige_termo, resumo_termo, validar_termo_operacional, montar_solicitacao_termo
)


def reservas_com_recurso():
    return Reserva.objects.select_related(
        'usuario', 'reservaveiculo__veiculo', 'reservarecursogeral__recurso_geral',
    ).prefetch_related('termos')


def resposta_arquivo(campo, nome, content_type):
    try:
        arquivo = campo.open('rb')
    except (FileNotFoundError, OSError):
        raise NotFound('O arquivo não está disponível. Entre em contato com a administração.')
    resposta = FileResponse(arquivo, as_attachment=True, filename=nome, content_type=content_type)
    resposta['Cache-Control'] = 'private, no-store'
    resposta['X-Content-Type-Options'] = 'nosniff'
    return resposta


class TermoReservaView(APIView):
    permission_classes = [PodeGerenciarReserva]
    parser_classes = [MultiPartParser, FormParser]

    def obter_reserva(self, request, pk, bloquear=False):
        if bloquear:
            queryset = Reserva.objects.select_for_update()
        else:
            queryset = Reserva.objects.all()
        reserva = get_object_or_404(queryset, pk=pk)
        self.check_object_permissions(request, reserva)
        self.validar_modalidade(reserva)
        return reserva

    def validar_modalidade(self, reserva):
        _, modalidade = reserva_concreta(reserva)

        if modalidade == 'veiculo':
            raise ValidationError(
                'Reservas de veículo utilizam apenas '
                'termos de retirada e devolução.'
            )

        if not reserva_exige_termo(reserva):
            raise ValidationError(
                'Esta reserva não exige termo de responsabilidade.'
            )

    def get(self, request, pk):
        return Response(resumo_termo(self.obter_reserva(request, pk), request.user))

    def post(self, request, pk):
        with transaction.atomic():
            reserva = self.obter_reserva(request, pk, bloquear=True)
            enviar_termo(reserva, request.user, request.FILES.get('arquivo'))
            return Response(resumo_termo(reserva, request.user), status=201)


class ModeloTermoView(TermoReservaView):
    http_method_names = ['get', 'head', 'options']

    def get(self, request, pk):
        reserva = self.obter_reserva(request, pk)
        caminho = modelo_da_reserva(reserva)
        resposta = FileResponse(caminho.open('rb'), as_attachment=True, filename=caminho.name,
                               content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        resposta['Cache-Control'] = 'private, no-store'
        return resposta


class TermoOperacionalView(TermoReservaView):
    def validar_modalidade(self, reserva):
        _, modalidade = reserva_concreta(reserva)
        if modalidade != 'veiculo':
            raise ValidationError('Este termo está disponível apenas para reservas de veículos.')

    def obter_tipo(self, tipo):
        tipos = {
            'retirada': TipoTermo.RETIRADA_VEICULO,
            'devolucao': TipoTermo.DEVOLUCAO_VEICULO,
        }
        documento = tipos.get(tipo)
        if documento is None:
            raise ValidationError('Tipo de documento operacional inválido.')
        return documento

    def get(self, request, pk, tipo):
        reserva = self.obter_reserva(request, pk)
        documento = self.obter_tipo(tipo)
        return Response(resumo_termo(reserva, request.user, documento))

    def post(self, request, pk, tipo):
        documento = self.obter_tipo(tipo)
        with transaction.atomic():
            reserva = self.obter_reserva(request, pk, bloquear=True)
            enviar_termo(reserva, request.user, request.FILES.get('arquivo'), documento)
            return Response(resumo_termo(reserva, request.user, documento), status=201)


class ModeloTermoOperacionalView(TermoOperacionalView):
    http_method_names = ['get', 'head', 'options']

    def get(self, request, pk, tipo):
        reserva = self.obter_reserva(request, pk)
        documento = self.obter_tipo(tipo)
        validar_termo_operacional(reserva, documento)
        caminho = modelo_da_reserva(reserva, documento)
        resposta = FileResponse(caminho.open('rb'), as_attachment=True, filename=caminho.name,
                               content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        resposta['Cache-Control'] = 'private, no-store'
        return resposta


class ArquivoTermoView(APIView):
    permission_classes = [PodeGerenciarReserva]
    original = False

    def get(self, request, pk):
        termo = get_object_or_404(TermoResponsabilidade.objects.select_related('reserva'), pk=pk)
        self.check_object_permissions(request, termo.reserva)
        if self.original:
            return resposta_arquivo(termo.arquivo_original, 'termo-em-branco.docx',
                                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        return resposta_arquivo(termo.arquivo_assinado, termo.nome_original, 'application/pdf')


class AnaliseTermoView(APIView):
    permission_classes = [SomenteAdministrador]

    def post(self, request, pk):
        serializer = AnaliseTermoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            reserva = get_object_or_404(Reserva.objects.select_for_update(), pk=pk)
            dados = serializer.validated_data
            analisar_termo(reserva, dados['termo_id'], request.user, dados['status'], dados['motivo'])
            return Response(resumo_termo(reserva, request.user))


class AnaliseTermoOperacionalView(AnaliseTermoView):
    def post(self, request, pk, tipo):
        serializer = AnaliseTermoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tipos = {
            'retirada': TipoTermo.RETIRADA_VEICULO,
            'devolucao': TipoTermo.DEVOLUCAO_VEICULO,
        }
        documento = tipos.get(tipo)
        if documento is None:
            raise ValidationError('Tipo de documento operacional inválido.')
        with transaction.atomic():
            reserva = get_object_or_404(Reserva.objects.select_for_update(), pk=pk)
            dados = serializer.validated_data
            analisar_termo(reserva, dados['termo_id'], request.user, dados['status'], dados['motivo'], documento)
            return Response(resumo_termo(reserva, request.user, documento))


class SolicitacoesTermoView(APIView):
    permission_classes = [SomenteAdministrador]

    def get(self, request):
        queryset = reservas_com_recurso().filter(
            Q(reservaveiculo__isnull=False)
            | Q(reservarecursogeral__recurso_geral__tem_termo_de_responsabilidade=True)
        )
        modalidade = request.query_params.get('tipo', 'todos')
        status = request.query_params.get('status', 'abertas')
        documento_parametro = request.query_params.get(
            'documento', 
            'todos')
        documentos = {
            'todos': None,
            'responsabilidade': TipoTermo.RESPONSABILIDADE,
            'retirada': TipoTermo.RETIRADA_VEICULO,
            'devolucao': TipoTermo.DEVOLUCAO_VEICULO,
        }
        documento = documentos.get(documento_parametro)
        if documento_parametro not in documentos:
            raise ValidationError({'documento': 'Tipo de documento inválido.'})
        if modalidade not in ('todos', 'veiculo', 'recurso_geral'):
            raise ValidationError({'tipo': 'Tipo de solicitação inválido.'})
        if modalidade != 'todos':
            if modalidade == 'veiculo':
                relacao = 'reservaveiculo'
            else:
                relacao = 'reservarecursogeral'
            queryset = queryset.filter(**{f'{relacao}__isnull': False})
        solicitacao_reserva_veiculo = Q(
            reservaveiculo__isnull=False,
            status=StatusReserva.PENDENTE,
        )
        aguardando_termo = (
            Q(reservarecursogeral__isnull=False, status__in=ABERTAS)
            | Q(reservaveiculo__isnull=False, status=StatusReserva.AGUARDANDO_TERMO_DEVOLUCAO)
        )
        if documento == TipoTermo.RESPONSABILIDADE:
            queryset = queryset.filter(reservarecursogeral__isnull=False)
        elif documento is not None:
            queryset = queryset.filter(termos__tipo=documento, termos__atual=True)
        else:
            queryset = queryset.filter(solicitacao_reserva_veiculo | aguardando_termo | Q(termos__atual=True)).distinct()
        if status == 'abertas':
            if documento == TipoTermo.RESPONSABILIDADE:
                queryset = queryset.filter(status__in=ABERTAS)
            elif documento is None:
                queryset = queryset.filter(
                    solicitacao_reserva_veiculo
                    | aguardando_termo
                    | Q(termos__atual=True, termos__status=StatusTermo.PENDENTE)
                ).distinct()
            else:
                queryset = queryset.filter(termos__status=StatusTermo.PENDENTE)
        elif status == 'todos':
            queryset = queryset.exclude(status=StatusReserva.CANCELADA)
        elif status in StatusReserva.values:
            queryset = queryset.filter(status=status)
        else:
            raise ValidationError({'status': 'Status de solicitação inválido.'})
        paginacao = PaginacaoPadrao()
        pagina = paginacao.paginate_queryset(queryset.order_by('-data', '-pk'), request)
        resultados = []

        for reserva in pagina:
            resultado = montar_solicitacao_termo(
                reserva,
                documento_parametro,
            )

            if resultado['origem_solicitacao'] == 'RESERVA':
                resultado['reserva_pendente'] = (
                    ReservaSerializer(reserva).data
                )
            else:
                resultado['reserva_pendente'] = None

            resultados.append(resultado)
        return paginacao.get_paginated_response(resultados)
