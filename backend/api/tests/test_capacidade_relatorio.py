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
    def test_capacidade_exclui_inativos_indisponiveis_e_ead(self):
        Area.objects.create(nome='Inativa', bloco=self.bloco, status='INATIVO')
        Area.objects.create(nome='Indisponivel', bloco=self.bloco, disponibilidade=False)
        Area.objects.create(nome='Moodle', bloco=self.bloco, caracteristica='EAD')
        self.recurso()
        self.recurso(status='INATIVO', quantidade_total=20)
        self.recurso(status='MANUTENCAO', quantidade_total=20)
        veiculo = dict(nome='Carro teste', marca='Marca', modelo='Modelo', capacidade=4,
                       combustivel='Gasolina', quilometragem=0, cor='Azul')
        Veiculo.objects.create(placa='ABC1234', status='ATIVO', **veiculo)
        Veiculo.objects.create(placa='ABC1235', status='INATIVO', **veiculo)
        self.assertEqual(_capacidade('todas', {}, 2), 5 * 16 * 2)
        self.assertEqual(_capacidade('area', {'recurso': self.area.pk}, 1), 16)

