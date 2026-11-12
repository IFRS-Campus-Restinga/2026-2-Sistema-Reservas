from datetime import timedelta
from uuid import uuid4

from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from accounts.enumerations import Papel
from accounts.models import HubUser
from api.enumerations.tipo_notificacao import TipoNotificacao
from api.models.grupo_model import Grupo
from api.models.notificacao_model import Notificacao
from api.views.notificacao_view import MarcarNotificacaoLidaView, MinhasNotificacoesListView
from .base_revisao import BaseRevisaoTests


class NotificacaoVencimentoGrupoTests(BaseRevisaoTests):
    def setUp(self):
        super().setUp()
        self.servidor = HubUser.objects.create(
            id=uuid4(),
            email='servidor.grupo@example.test',
            nome='Servidor Criador',
            papel=Papel.SERVIDOR,
            is_active=True,
        )
        self.outro_servidor = HubUser.objects.create(
            id=uuid4(),
            email='outro.servidor@example.test',
            nome='Outro Servidor',
            papel=Papel.SERVIDOR,
            is_active=True,
        )
        self.hoje = timezone.localdate()

    def _criar_grupo(self, criador, nome, dias_para_vencer):
        return Grupo.objects.create(
            nome=nome,
            tipo_membro_permitido=Papel.ALUNO,
            data_inicio_validade=self.hoje - timedelta(days=10),
            data_fim_validade=(
                self.hoje + timedelta(days=dias_para_vencer)
                if dias_para_vencer is not None
                else None
            ),
            criador=criador,
        )

    def _listar_notificacoes(self, usuario):
        request = APIRequestFactory().get('/')
        force_authenticate(request, user=usuario)
        return MinhasNotificacoesListView.as_view()(request)

    def _marcar_lida(self, usuario, notificacao_id):
        request = APIRequestFactory().patch('/')
        force_authenticate(request, user=usuario)
        return MarcarNotificacaoLidaView.as_view()(request, pk=notificacao_id)

    def test_notifica_apenas_grupos_do_criador_dentro_da_janela_de_7_dias(self):
        grupo_hoje = self._criar_grupo(self.servidor, 'Grupo Hoje', 0)
        grupo_sete_dias = self._criar_grupo(self.servidor, 'Grupo Sete Dias', 7)
        self._criar_grupo(self.servidor, 'Grupo Oito Dias', 8)
        self._criar_grupo(self.servidor, 'Grupo Vencido', -1)
        self._criar_grupo(self.servidor, 'Grupo Sem Fim', None)
        self._criar_grupo(self.outro_servidor, 'Grupo Outro Criador', 2)

        resposta = self._listar_notificacoes(self.servidor)

        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.data['count'], 2)
        self.assertEqual(resposta.data['nao_lidas'], 2)

        grupos_notificados = {item['grupo']['id']: item for item in resposta.data['results']}
        self.assertEqual(set(grupos_notificados.keys()), {grupo_hoje.id, grupo_sete_dias.id})
        self.assertIsNone(grupos_notificados[grupo_hoje.id]['reserva'])
        self.assertEqual(grupos_notificados[grupo_hoje.id]['tipo'], TipoNotificacao.GRUPO_PROXIMO_VENCIMENTO)
        self.assertIn('vence hoje', grupos_notificados[grupo_hoje.id]['mensagem'])
        self.assertIn('vence em 7 dias', grupos_notificados[grupo_sete_dias.id]['mensagem'])

    def test_nao_duplica_nem_reabre_notificacao_lida_na_mesma_vigencia(self):
        self._criar_grupo(self.servidor, 'Grupo Estavel', 3)

        primeira = self._listar_notificacoes(self.servidor)
        notificacao_id = primeira.data['results'][0]['id']

        marcar = self._marcar_lida(self.servidor, notificacao_id)
        self.assertEqual(marcar.status_code, 200)
        self.assertTrue(marcar.data['lida'])

        segunda = self._listar_notificacoes(self.servidor)
        self.assertEqual(segunda.data['count'], 1)
        self.assertEqual(segunda.data['nao_lidas'], 0)
        self.assertTrue(segunda.data['results'][0]['lida'])

    def test_reavisa_quando_data_fim_validade_do_grupo_e_alterada(self):
        grupo = self._criar_grupo(self.servidor, 'Grupo Prorrogado', 2)

        primeira = self._listar_notificacoes(self.servidor)
        notificacao_id = primeira.data['results'][0]['id']
        self._marcar_lida(self.servidor, notificacao_id)

        grupo.data_fim_validade = self.hoje + timedelta(days=5)
        grupo.save()

        segunda = self._listar_notificacoes(self.servidor)
        self.assertEqual(segunda.data['count'], 1)
        self.assertEqual(segunda.data['nao_lidas'], 1)
        self.assertFalse(segunda.data['results'][0]['lida'])
        self.assertIn('vence em 5 dias', segunda.data['results'][0]['mensagem'])

    def test_grupo_excluido_logicamente_nao_gera_nem_exibe_notificacao(self):
        grupo = self._criar_grupo(self.servidor, 'Grupo Excluido', 1)

        primeira = self._listar_notificacoes(self.servidor)
        self.assertEqual(primeira.data['count'], 1)

        grupo.delete()

        segunda = self._listar_notificacoes(self.servidor)
        self.assertEqual(segunda.data['count'], 0)
        self.assertEqual(segunda.data['nao_lidas'], 0)

    def test_remove_notificacao_quando_grupo_e_renovado_para_fora_da_janela(self):
        grupo = self._criar_grupo(self.servidor, 'Grupo Renovado', 2)

        primeira = self._listar_notificacoes(self.servidor)
        self.assertEqual(primeira.data['count'], 1)

        grupo.data_fim_validade = self.hoje + timedelta(days=60)
        grupo.save()

        segunda = self._listar_notificacoes(self.servidor)
        self.assertEqual(segunda.data['count'], 0)
        self.assertEqual(segunda.data['nao_lidas'], 0)

    def test_notificacao_exige_exclusivamente_reserva_ou_grupo(self):
        invalida = Notificacao(
            usuario=self.servidor,
            tipo=TipoNotificacao.GRUPO_PROXIMO_VENCIMENTO,
            titulo='Teste',
            mensagem='Sem vínculo',
        )
        with self.assertRaises(ValidationError):
            invalida.full_clean()
