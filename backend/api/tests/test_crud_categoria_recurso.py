from rest_framework.test import APIRequestFactory, force_authenticate

from api.models.categoria_recurso_model import CategoriaRecurso
from api.views.categoria_recurso_view import CategoriaRecursoDetailView, CategoriaRecursoListCreateView
from api.views.tipo_recurso_view import TipoRecursoCreateView
from .base_revisao import BaseRevisaoTests


class CrudCategoriaRecursoTests(BaseRevisaoTests):
    def setUp(self):
        super().setUp()
        self.categoria = CategoriaRecurso.objects.create(nome='Audiovisual', icone='AUDIOVISUAL')

    def requisicao(self, metodo, dados=None, pk=None, usuario=None):
        request = getattr(APIRequestFactory(), metodo)('/', dados or {}, format='json')
        force_authenticate(request, user=usuario or self.usuario)
        if pk is None:
            return CategoriaRecursoListCreateView.as_view()(request)
        return CategoriaRecursoDetailView.as_view()(request, pk=pk)

    def test_lista_com_total_de_tipos(self):
        self.tipo.categoria = self.categoria
        self.tipo.save()
        resposta = self.requisicao('get')
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.data['results'][0]['total_tipos'], 1)

    def test_cria_categoria(self):
        resposta = self.requisicao('post', {'nome': 'Laboratório', 'icone': 'FERRAMENTAS'})
        self.assertEqual(resposta.status_code, 201)

    def test_nao_permite_nome_repetido(self):
        resposta = self.requisicao('post', {'nome': 'audiovisual', 'icone': 'OUTROS'})
        self.assertEqual(resposta.status_code, 400)

    def test_edita_categoria(self):
        resposta = self.requisicao('patch', {'nome': 'Áudio e vídeo'}, pk=self.categoria.pk)
        self.assertEqual(resposta.status_code, 200)
        self.categoria.refresh_from_db()
        self.assertEqual(self.categoria.nome, 'Áudio e vídeo')

    def test_nao_exclui_categoria_em_uso(self):
        self.tipo.categoria = self.categoria
        self.tipo.save()
        self.assertEqual(self.requisicao('delete', pk=self.categoria.pk).status_code, 400)
        self.assertTrue(CategoriaRecurso.objects.filter(pk=self.categoria.pk).exists())

    def test_exclui_categoria_sem_tipos(self):
        self.assertEqual(self.requisicao('delete', pk=self.categoria.pk).status_code, 204)

    def test_catalogo_filtra_por_categoria_e_devolve_icone(self):
        self.tipo.categoria = self.categoria
        self.tipo.save()
        self.recurso()
        request = APIRequestFactory().get('/', {'catalogo': 'true', 'categoria': self.categoria.pk})
        force_authenticate(request, user=self.usuario)
        resposta = TipoRecursoCreateView.as_view()(request)
        self.assertEqual(resposta.data['count'], 1)
        self.assertEqual(resposta.data['results'][0]['categoria_icone'], 'AUDIOVISUAL')
