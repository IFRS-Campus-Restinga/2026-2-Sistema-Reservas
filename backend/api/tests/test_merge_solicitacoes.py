from django.urls import resolve

from api.enumerations import TipoTermo
from api.models import ReservaArea, ReservaVeiculo, TermoResponsabilidade, Veiculo
from api.models.notificacao_model import Notificacao
from api.services.termo_service import montar_solicitacao_termo
from api.views.notificacao_view import MinhasNotificacoesListView
from api.views.termo_view import SolicitacoesTermoView
from .base_revisao import BaseRevisaoTests


class IntegracaoSolicitacoesTests(BaseRevisaoTests):
    def veiculo_reservado(self):
        veiculo = Veiculo.objects.create(nome='Carro', placa='ABC1234', marca='Marca',
            modelo='Modelo', capacidade=5, combustivel='Gasolina', quilometragem=0, cor='Branco')
        return ReservaVeiculo.objects.create(veiculo=veiculo, destino='Campus', finalidade='Visita',
            quantidade_passageiros=2, data_devolucao_prevista=self.dia, **self.dados())

    def test_pendentes_area_e_veiculo_continuam_acessiveis(self):
        area = ReservaArea.objects.create(area=self.area, **self.dados())
        ReservaArea.objects.filter(pk=area.pk).update(status='PENDENTE')
        veiculo = self.veiculo_reservado()
        resposta = self.resposta(SolicitacoesTermoView, {'situacao': 'abertas'})
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual({r['id'] for r in resposta.data['results']}, {area.pk, veiculo.pk})
        for item in resposta.data['results']:
            self.assertEqual(item['origem_solicitacao'], 'RESERVA')
            self.assertEqual(item['situacao'], 'AGUARDANDO_CONFIRMACAO')
            self.assertEqual(item['reserva_pendente']['id'], item['id'])

    def test_documento_filtrado_nao_e_trocado_por_outro_pendente(self):
        reserva = self.veiculo_reservado()
        for tipo, status in [(TipoTermo.RETIRADA_VEICULO, 'APROVADO'), (TipoTermo.DEVOLUCAO_VEICULO, 'PENDENTE')]:
            TermoResponsabilidade.objects.create(reserva=reserva, tipo=tipo, status=status,
                enviado_por=self.usuario, nome_original='termo.pdf')
        resultado = montar_solicitacao_termo(reserva, 'retirada')
        self.assertEqual(resultado['termo_tipo'], 'retirada')
        self.assertEqual(resultado['termo_status'], 'APROVADO')

    def test_notificacao_paginada_e_busca_da_solicitacao(self):
        reserva = self.veiculo_reservado()
        Notificacao.objects.create(usuario=self.usuario, reserva=reserva, tipo='RESERVA_CONFIRMADA',
            titulo='Reserva', mensagem='Mensagem')
        resposta = self.resposta(MinhasNotificacoesListView, {})
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(len(resposta.data['results']), 1)
        self.assertEqual(resposta.data['nao_lidas'], 1)
        resposta = self.resposta(SolicitacoesTermoView, {'reserva': reserva.pk, 'situacao': 'todos'})
        self.assertEqual(resposta.data['count'], 1)
        self.assertEqual(resposta.data['results'][0]['id'], reserva.pk)

    def test_rotas_das_duas_branches_preservadas(self):
        for rota in ['reservas/admin/', 'reservas/pendentes/', 'reservas/minhas/',
                     'reservas/resumo/', 'relatorios/uso/', 'reservas/disponibilidade/opcoes/',
                     'notificacoes/lidas/']:
            self.assertIsNotNone(resolve('/api/' + rota).func)
