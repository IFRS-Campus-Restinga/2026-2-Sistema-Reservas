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


class BaseRevisaoTests(TestCase):
    def setUp(self):
        self.usuario = HubUser.objects.create(id=uuid4(), email='revisao@example.test', nome='Admin', is_staff=True, is_active=True)
        self.dia = timezone.localdate() + timedelta(days=1)
        self.bloco = Bloco.objects.create(nome='Bloco teste', numero='1')
        self.area = Area.objects.create(nome='Sala teste', bloco=self.bloco)
        self.tipo = TipoRecurso.objects.create(descricao='Equipamentos')

    def dados(self):
        return dict(nome='Reserva teste', usuario=self.usuario, data=self.dia,
                    horario_inicio=time(8), horario_fim=time(9), tipo_reserva='INTERNA')

    def recurso(self, **kwargs):
        dados = dict(nome='Projetor', tipo_recurso=self.tipo, tipo_prazo='CURTO',
                     quantidade_total=3, status='ATIVO')
        dados.update(kwargs)
        return RecursoGeral.objects.create(**dados)

    def resposta(self, view, parametros):
        request = APIRequestFactory().get('/', parametros)
        force_authenticate(request, user=self.usuario)
        return view.as_view()(request)

