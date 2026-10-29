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
    def test_todos_inclui_confirmadas_e_exclui_canceladas(self):
        recurso = self.recurso(tem_termo_de_responsabilidade=True)
        reservas = []
        for status in ('AGUARDANDO_TERMO', 'CONFIRMADA', 'CANCELADA'):
            reserva = ReservaRecursoGeral.objects.create(recurso_geral=recurso, quantidades=1,
                        data_devolucao_prevista=self.dia, **self.dados())
            ReservaRecursoGeral.objects.filter(pk=reserva.pk).update(status=status)
            reservas.append(reserva)
        todos = self.resposta(SolicitacoesTermoView, {'situacao': 'todos'})
        abertas = self.resposta(SolicitacoesTermoView, {'situacao': 'abertas'})
        self.assertEqual(todos.status_code, 200)
        self.assertEqual(abertas.status_code, 200)
        self.assertEqual(todos.data['count'], 2)
        self.assertEqual(abertas.data['count'], 1)

    def test_todos_documentos_inclui_confirmadas_sem_termo_atual(self):
        recurso = self.recurso(tem_termo_de_responsabilidade=True)
        reserva = ReservaRecursoGeral.objects.create(recurso_geral=recurso, quantidades=1,
                    data_devolucao_prevista=self.dia, **self.dados())
        ReservaRecursoGeral.objects.filter(pk=reserva.pk).update(status='CONFIRMADA')
        resposta = self.resposta(SolicitacoesTermoView, {'situacao': 'todos', 'documento': 'todos'})
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.data['count'], 1)

