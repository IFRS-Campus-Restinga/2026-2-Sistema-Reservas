from datetime import time, timedelta
from unittest.mock import patch
from uuid import uuid4

from django.test import TestCase
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIRequestFactory, force_authenticate

from accounts.models import HubUser
from api.models.area_model import Area
from api.models.bloco_model import Bloco
from api.models.recurso_geral_model import RecursoGeral
from api.models.reserva_area_model import ReservaArea
from api.models.reserva_recurso_geral_model import ReservaRecursoGeral
from api.models.tipo_recurso_model import TipoRecurso
from api.models.veiculo_model import Veiculo
from api.services.opcoes_disponibilidade_service import opcoes_area
from api.services.relatorio_uso_service import _capacidade
from api.validators.reserva_area_validator import validar_disponibilidade_area
from api.views.relatorio_uso_view import RelatorioUsoView
from api.views.termo_view import SolicitacoesTermoView


from .base_revisao import BaseRevisaoTests


class RevisaoTests(BaseRevisaoTests):
    def test_calendario_e_validacao_concordam_sobre_conflitos(self):
        reserva = ReservaArea.objects.create(area=self.area, status='CONFIRMADA', **self.dados())
        dados = dict(area=self.area, **self.dados())
        with self.assertRaises(ValidationError):
            validar_disponibilidade_area(dados)
        horarios = opcoes_area(self.area.pk, self.dia.year, self.dia.month)[str(self.dia)]
        self.assertNotIn('08:00', horarios)
        self.assertIn('09:00', horarios)
        validar_disponibilidade_area(dados, excluir_reserva=reserva.pk)
        horarios = opcoes_area(self.area.pk, self.dia.year, self.dia.month, excluir_reserva=reserva.pk)[str(self.dia)]
        self.assertIn('08:00', horarios)
        reserva.status = 'CANCELADA'
        reserva.save()
        validar_disponibilidade_area(dados)
        self.assertIn('08:00', opcoes_area(self.area.pk, self.dia.year, self.dia.month)[str(self.dia)])

