from django.core.exceptions import ObjectDoesNotExist
from rest_framework.exceptions import ValidationError
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from api.permissions.regras_comuns import UsuarioAutenticado
from api.permissions.regras_comuns import usuario_e_admin
from api.models.reserva_model import Reserva
from api.services.opcoes_disponibilidade_service import (
    opcoes_area, opcoes_recurso_geral, opcoes_veiculo,
)


class OpcoesDisponibilidadeView(APIView):
    permission_classes = [UsuarioAutenticado]

    def get(self, request):
        parametros = request.query_params
        tipo = parametros.get('tipo', '').upper()
        try:
            recurso = int(parametros.get('recurso', ''))
            ano, mes = map(int, parametros.get('mes', '').split('-'))
            if not 1 <= mes <= 12:
                raise ValueError
            quantidade = int(parametros.get('quantidade', 1))
            excluir = int(parametros['excluir_reserva']) if parametros.get('excluir_reserva') else None
        except (TypeError, ValueError):
            raise ValidationError({'detail': 'Informe tipo, recurso e mês válidos.'})

        consultas = {
            'AREA': lambda: opcoes_area(recurso, ano, mes, excluir, request.user),
            'VEICULO': lambda: opcoes_veiculo(recurso, ano, mes, excluir, request.user),
            'RECURSO_GERAL': lambda: opcoes_recurso_geral(recurso, ano, mes, quantidade, excluir, request.user),
        }
        if tipo not in consultas:
            raise ValidationError({'tipo': 'Informe AREA, VEICULO ou RECURSO_GERAL.'})
        if excluir:
            reserva = Reserva.objects.select_related(
                'reservaarea', 'reservaveiculo', 'reservarecursogeral',
            ).filter(pk=excluir).first()
            if reserva is None:
                raise ValidationError({'excluir_reserva': 'Reserva não encontrada.'})
            if reserva.usuario_id != request.user.pk and not usuario_e_admin(request.user):
                raise PermissionDenied('Você não pode excluir esta reserva da consulta de disponibilidade.')
            recursos = {
                'AREA': getattr(getattr(reserva, 'reservaarea', None), 'area_id', None),
                'VEICULO': getattr(getattr(reserva, 'reservaveiculo', None), 'veiculo_id', None),
                'RECURSO_GERAL': getattr(getattr(reserva, 'reservarecursogeral', None), 'recurso_geral_id', None),
            }
            if recursos[tipo] != recurso:
                raise ValidationError({
                    'excluir_reserva': 'A reserva não pertence ao recurso informado.',
                })
        try:
            horarios = consultas[tipo]()
        except ObjectDoesNotExist:
            raise ValidationError({'recurso': 'Recurso não encontrado.'})
        return Response({'dias_disponiveis': list(horarios), 'horarios': horarios})
