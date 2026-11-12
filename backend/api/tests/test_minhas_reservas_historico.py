from datetime import timedelta
from uuid import uuid4

from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from accounts.enumerations import Papel
from accounts.models import HubUser
from api.enumerations.tipo_recurso_reservavel import TipoRecursoReservavel
from api.models import AutorizacaoGrupo, Grupo, MembroGrupo, ReservaArea
from api.views.minhas_reservas_view import MinhasReservasListView
from hub_integrations.views.me import quem_sou_eu
from .base_revisao import BaseRevisaoTests


class MinhasReservasHistoricoTests(BaseRevisaoTests):
    def setUp(self):
        super().setUp()
        self.hoje = timezone.localdate()
        self.aluno = HubUser.objects.create(
            id=uuid4(),
            email='aluno.historico@example.test',
            nome='Aluno Histórico',
            papel=Papel.ALUNO,
            is_active=True,
        )

    def _me(self, usuario):
        request = APIRequestFactory().get('/session/me/')
        force_authenticate(request, user=usuario)
        return quem_sou_eu(request)

    def _minhas_reservas(self, usuario):
        request = APIRequestFactory().get('/api/reservas/minhas/')
        force_authenticate(request, user=usuario)
        return MinhasReservasListView.as_view()(request)

    def _criar_reserva_aluno(self, nome='Reserva Antiga'):
        dados = self.dados()
        dados['usuario'] = self.aluno
        dados['nome'] = nome
        return ReservaArea.objects.create(area=self.area, **dados)

    def test_aluno_sem_grupo_e_sem_reservas_nao_possui_reservas(self):
        resposta = self._me(self.aluno)
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(resposta.data['autorizacoes'], [])
        self.assertFalse(resposta.data['permissoes']['possui_reservas'])

    def test_aluno_com_grupo_expirado_mas_com_reserva_mantem_possui_reservas(self):
        grupo = Grupo.objects.create(
            nome='Grupo Expirado',
            tipo_membro_permitido=Papel.ALUNO,
            data_inicio_validade=self.hoje - timedelta(days=30),
            data_fim_validade=self.hoje - timedelta(days=1),
            criador=self.usuario,
        )
        AutorizacaoGrupo.objects.create(
            grupo=grupo,
            tipo_recurso_autorizado=TipoRecursoReservavel.AREA,
        )
        MembroGrupo.objects.create(grupo=grupo, usuario=self.aluno)
        self._criar_reserva_aluno()

        resposta_me = self._me(self.aluno)
        self.assertEqual(resposta_me.status_code, 200)
        self.assertEqual(resposta_me.data['autorizacoes'], [])
        self.assertTrue(resposta_me.data['permissoes']['possui_reservas'])

        resposta_reservas = self._minhas_reservas(self.aluno)
        self.assertEqual(resposta_reservas.status_code, 200)
        self.assertEqual(resposta_reservas.data['count'], 1)
        self.assertEqual(resposta_reservas.data['results'][0]['nome'], 'Reserva Antiga')

    def test_aluno_removido_de_grupo_mas_com_reserva_mantem_acesso_ao_historico(self):
        grupo = Grupo.objects.create(
            nome='Grupo Vigente',
            tipo_membro_permitido=Papel.ALUNO,
            data_inicio_validade=self.hoje - timedelta(days=5),
            data_fim_validade=self.hoje + timedelta(days=10),
            criador=self.usuario,
        )
        AutorizacaoGrupo.objects.create(
            grupo=grupo,
            tipo_recurso_autorizado=TipoRecursoReservavel.AREA,
        )
        membro = MembroGrupo.objects.create(grupo=grupo, usuario=self.aluno)
        self._criar_reserva_aluno('Reserva Antes da Saída')
        membro.delete()

        resposta_me = self._me(self.aluno)
        self.assertEqual(resposta_me.data['autorizacoes'], [])
        self.assertTrue(resposta_me.data['permissoes']['possui_reservas'])

        resposta_reservas = self._minhas_reservas(self.aluno)
        self.assertEqual(resposta_reservas.status_code, 200)
        self.assertEqual(resposta_reservas.data['count'], 1)
