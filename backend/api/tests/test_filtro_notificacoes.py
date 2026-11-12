from rest_framework.test import APIRequestFactory, force_authenticate

from api.enumerations.tipo_notificacao import TipoNotificacao
from api.models.notificacao_model import Notificacao
from api.models.reserva_area_model import ReservaArea
from api.views.notificacao_view import MinhasNotificacoesListView
from .base_revisao import BaseRevisaoTests


class FiltroNotificacoesLidasTests(BaseRevisaoTests):
    def setUp(self):
        super().setUp()
        reserva = ReservaArea.objects.create(area=self.area, **self.dados())
        base = dict(usuario=self.usuario, reserva=reserva, titulo='Aviso', mensagem='Mensagem')
        Notificacao.objects.create(tipo=TipoNotificacao.CONFIRMACAO_RESERVA, lida=True, **base)
        Notificacao.objects.create(tipo=TipoNotificacao.CANCELAMENTO_RESERVA, lida=False, **base)
        Notificacao.objects.create(tipo=TipoNotificacao.REJEICAO_RESERVA, lida=False, **base)

    def listar(self, parametros):
        request = APIRequestFactory().get('/', parametros)
        force_authenticate(request, user=self.usuario)
        return MinhasNotificacoesListView.as_view()(request)

    def test_sem_filtro_lista_todas(self):
        resposta = self.listar({})
        self.assertEqual(resposta.data['count'], 3)
        self.assertEqual(resposta.data['nao_lidas'], 2)

    def test_filtra_nao_lidas(self):
        resposta = self.listar({'lida': 'false'})
        self.assertEqual(resposta.data['count'], 2)
        self.assertTrue(all(not item['lida'] for item in resposta.data['results']))

    def test_filtra_lidas_sem_alterar_contador_de_nao_lidas(self):
        resposta = self.listar({'lida': 'true'})
        self.assertEqual(resposta.data['count'], 1)
        self.assertEqual(resposta.data['nao_lidas'], 2)

    def test_valor_invalido_retorna_400(self):
        self.assertEqual(self.listar({'lida': 'talvez'}).status_code, 400)
