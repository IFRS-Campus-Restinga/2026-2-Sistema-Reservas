from rest_framework.test import APIRequestFactory, force_authenticate

from api.models.equipamento_area_model import EquipamentoArea
from api.views.area_view import AreaDetailView
from api.views.equipamento_area_view import EquipamentoAreaDetailView, EquipamentoAreaListCreateView
from .base_revisao import BaseRevisaoTests


class CrudEquipamentoAreaTests(BaseRevisaoTests):
    def setUp(self):
        super().setUp()
        # A migration 0030 já cria os equipamentos padrão (Projetor, TV...)
        self.projetor, _ = EquipamentoArea.objects.get_or_create(nome='Projetor')

    def requisicao(self, view, metodo, dados=None, **kwargs):
        request = getattr(APIRequestFactory(), metodo)('/', dados or {}, format='json')
        force_authenticate(request, user=self.usuario)
        return view.as_view()(request, **kwargs)

    def test_cria_e_lista_equipamento(self):
        resposta = self.requisicao(EquipamentoAreaListCreateView, 'post', {'nome': 'Lousa digital'})
        self.assertEqual(resposta.status_code, 201)
        resposta = self.requisicao(EquipamentoAreaListCreateView, 'get', {'busca': 'lousa'})
        self.assertEqual(resposta.data['count'], 1)

    def test_nao_permite_nome_repetido(self):
        resposta = self.requisicao(EquipamentoAreaListCreateView, 'post', {'nome': 'projetor'})
        self.assertEqual(resposta.status_code, 400)

    def test_area_recebe_e_devolve_equipamentos(self):
        resposta = self.requisicao(AreaDetailView, 'patch', {'equipamentos': [self.projetor.pk]}, pk=self.area.pk)
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.data['equipamentos_detalhe'], [{'id': self.projetor.pk, 'nome': 'Projetor'}])

    def test_nao_exclui_equipamento_em_uso(self):
        self.area.equipamentos.add(self.projetor)
        resposta = self.requisicao(EquipamentoAreaDetailView, 'delete', pk=self.projetor.pk)
        self.assertEqual(resposta.status_code, 400)
        self.assertTrue(EquipamentoArea.objects.filter(pk=self.projetor.pk).exists())

    def test_exclui_equipamento_sem_uso(self):
        resposta = self.requisicao(EquipamentoAreaDetailView, 'delete', pk=self.projetor.pk)
        self.assertEqual(resposta.status_code, 204)

    def test_edita_equipamento(self):
        resposta = self.requisicao(EquipamentoAreaDetailView, 'put', {'nome': 'Projetor multimídia'}, pk=self.projetor.pk)
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.data['nome'], 'Projetor multimídia')
