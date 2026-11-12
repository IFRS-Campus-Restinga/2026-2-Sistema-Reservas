from rest_framework.test import APIRequestFactory, force_authenticate

from api.models.categoria_recurso_model import CategoriaRecurso
from api.models.tipo_recurso_model import TipoRecurso
from api.views.tipo_recurso_view import TipoRecursoCreateView, TipoRecursoDetailView
from .base_revisao import BaseRevisaoTests


class CrudTipoRecursoTests(BaseRevisaoTests):
    def setUp(self):
        super().setUp()
        self.categoria = CategoriaRecurso.objects.create(nome='Informática', icone='INFORMATICA')

    def requisicao(self, metodo, dados=None, pk=None):
        request = getattr(APIRequestFactory(), metodo)('/', dados or {}, format='json')
        force_authenticate(request, user=self.usuario)
        if pk is None:
            return TipoRecursoCreateView.as_view()(request)
        return TipoRecursoDetailView.as_view()(request, pk=pk)

    def test_cria_tipo(self):
        resposta = self.requisicao('post', {'descricao': '  Notebooks  ', 'categoria': self.categoria.pk})
        self.assertEqual(resposta.status_code, 201)
        self.assertEqual(resposta.data['descricao'], 'Notebooks')
        self.assertEqual(resposta.data['categoria_nome'], 'Informática')

    def test_nao_permite_descricao_repetida(self):
        resposta = self.requisicao('post', {'descricao': 'equipamentos', 'categoria': None})
        self.assertEqual(resposta.status_code, 400)
        self.assertIn('descricao', resposta.data)

    def test_edita_tipo(self):
        resposta = self.requisicao('put', {'descricao': 'Equipamentos gerais', 'categoria': self.categoria.pk}, pk=self.tipo.pk)
        self.assertEqual(resposta.status_code, 200)
        self.tipo.refresh_from_db()
        self.assertEqual(self.tipo.descricao, 'Equipamentos gerais')

    def test_editar_mantendo_a_mesma_descricao_nao_acusa_duplicidade(self):
        resposta = self.requisicao('patch', {'descricao': 'Equipamentos'}, pk=self.tipo.pk)
        self.assertEqual(resposta.status_code, 200)

    def test_exclui_tipo_sem_recursos(self):
        resposta = self.requisicao('delete', pk=self.tipo.pk)
        self.assertEqual(resposta.status_code, 204)
        self.assertFalse(TipoRecurso.objects.filter(pk=self.tipo.pk).exists())

    def test_nao_exclui_tipo_com_recursos(self):
        self.recurso()
        resposta = self.requisicao('delete', pk=self.tipo.pk)
        self.assertEqual(resposta.status_code, 400)
        self.assertTrue(TipoRecurso.objects.filter(pk=self.tipo.pk).exists())
