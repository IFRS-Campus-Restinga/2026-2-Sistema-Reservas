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
    def test_limite_relatorio_retorna_400_sem_truncar(self):
        for _ in range(2):
            ReservaArea.objects.create(area=self.area, status='CONFIRMADA', **self.dados())
        parametros = dict(data_inicio=str(self.dia), data_fim=str(self.dia))
        with patch('api.services.relatorio_uso_service.LIMITE_REGISTROS', 1):
            resposta = self.resposta(RelatorioUsoView, parametros)
        self.assertEqual(resposta.status_code, 400)
        self.assertIn('filtros', str(resposta.data))
        with patch('api.services.relatorio_uso_service.LIMITE_REGISTROS', 2):
            resposta = self.resposta(RelatorioUsoView, parametros)
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.data['resumo']['total_reservas'], 2)

