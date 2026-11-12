from datetime import time, timedelta
from uuid import uuid4

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from accounts.enumerations import Papel
from accounts.models import HubUser
from api.enumerations.auditoria_enumerations import AcaoAuditoria
from api.enumerations.status_reserva import StatusReserva
from api.enumerations.tipo_notificacao import TipoNotificacao
from api.enumerations.tipo_recurso_reservavel import TipoRecursoReservavel
from api.models.area_model import Area
from api.models.autorizacao_grupo_model import AutorizacaoGrupo
from api.models.bloco_model import Bloco
from api.models.grupo_model import Grupo
from api.models.log_auditoria_model import LogAuditoria
from api.models.membro_grupo_model import MembroGrupo
from api.models.notificacao_model import Notificacao
from api.models.recorrencia_model import Recorrencia
from api.models.recurso_geral_model import RecursoGeral
from api.models.reserva_area_model import ReservaArea
from api.models.reserva_recurso_geral_model import ReservaRecursoGeral
from api.models.tipo_recurso_model import TipoRecurso
from api.permissions.reserva_permissions import autor_grupo_gerencia_reserva, usuario_pode_gerenciar_reserva
from api.views.grupo_view import ReservasGrupoListView
from api.views.recorrencia_view import RecorrenciaReservaAreaDetailView
from api.views.reserva_area_view import ReservaAreaDetailView
from api.views.reserva_recurso_geral_view import ReservaRecursoGeralDetailView


class DonoGrupoGerenciaReservasTests(TestCase):
    def setUp(self):
        self.hoje = timezone.localdate()
        self.dia = self.hoje + timedelta(days=2)

        self.professor = HubUser.objects.create(
            id=uuid4(),
            email="professor@ifrs.edu.br",
            nome="Prof. Silva",
            papel=Papel.SERVIDOR,
            is_active=True,
        )
        self.outro_professor = HubUser.objects.create(
            id=uuid4(),
            email="outro.prof@ifrs.edu.br",
            nome="Prof. Maria",
            papel=Papel.SERVIDOR,
            is_active=True,
        )
        self.aluno = HubUser.objects.create(
            id=uuid4(),
            email="aluno@aluno.ifrs.edu.br",
            nome="João Aluno",
            papel=Papel.ALUNO,
            is_active=True,
        )
        self.outro_aluno = HubUser.objects.create(
            id=uuid4(),
            email="outro.aluno@aluno.ifrs.edu.br",
            nome="Carlos Aluno",
            papel=Papel.ALUNO,
            is_active=True,
        )

        self.bloco = Bloco.objects.create(nome="Bloco A", numero="1")
        self.area = Area.objects.create(nome="Laboratório 101", bloco=self.bloco, status="ATIVO")
        self.tipo_recurso = TipoRecurso.objects.create(descricao="Projetores")
        self.recurso = RecursoGeral.objects.create(
            nome="Projetor Epson",
            tipo_recurso=self.tipo_recurso,
            tipo_prazo="CURTO",
            quantidade_total=5,
            status="ATIVO",
        )

        # Grupo criado pelo professor para alunos, autorizando Área e Recurso Geral
        self.grupo = Grupo.objects.create(
            nome="Projeto Pesquisa",
            tipo_membro_permitido=Papel.ALUNO,
            data_inicio_validade=self.hoje - timedelta(days=5),
            data_fim_validade=self.hoje + timedelta(days=30),
            criador=self.professor,
        )
        AutorizacaoGrupo.objects.create(
            grupo=self.grupo,
            tipo_recurso_autorizado=TipoRecursoReservavel.AREA,
        )
        AutorizacaoGrupo.objects.create(
            grupo=self.grupo,
            tipo_recurso_autorizado=TipoRecursoReservavel.RECURSO_GERAL,
            tipo_recurso=self.tipo_recurso,
        )
        self.membro = MembroGrupo.objects.create(
            grupo=self.grupo,
            usuario=self.aluno,
        )

        self.reserva_area = ReservaArea.objects.create(
            nome="Reserva Estudo",
            descricao="Estudo em grupo",
            status=StatusReserva.CONFIRMADA,
            data=self.dia,
            horario_inicio=time(14, 0),
            horario_fim=time(16, 0),
            tipo_reserva="INTERNA",
            usuario=self.aluno,
            area=self.area,
        )

        self.reserva_recurso = ReservaRecursoGeral.objects.create(
            nome="Reserva Projetor",
            descricao="Apresentação",
            status=StatusReserva.CONFIRMADA,
            data=self.dia,
            horario_inicio=time(10, 0),
            horario_fim=time(12, 0),
            data_devolucao_prevista=self.dia,
            tipo_reserva="INTERNA",
            usuario=self.aluno,
            recurso_geral=self.recurso,
            quantidades=1,
        )

    def test_autor_grupo_gerencia_reserva_aluno_membro(self):
        # O professor criador do grupo deve poder gerenciar as reservas do aluno
        self.assertTrue(autor_grupo_gerencia_reserva(self.professor, self.reserva_area))
        self.assertTrue(autor_grupo_gerencia_reserva(self.professor, self.reserva_recurso))
        self.assertTrue(usuario_pode_gerenciar_reserva(self.professor, self.reserva_area))

        # Outro professor que não é criador do grupo NÃO pode gerenciar
        self.assertFalse(autor_grupo_gerencia_reserva(self.outro_professor, self.reserva_area))
        self.assertFalse(usuario_pode_gerenciar_reserva(self.outro_professor, self.reserva_area))

        # Outro aluno NÃO pode gerenciar
        self.assertFalse(autor_grupo_gerencia_reserva(self.outro_aluno, self.reserva_area))

    def test_professor_pode_editar_reserva_aluno_gera_notificacao_e_auditoria(self):
        factory = APIRequestFactory()
        novo_horario_inicio = "15:00:00"
        novo_horario_fim = "17:00:00"
        payload = {
            "nome": "Reserva Estudo Editada",
            "horario_inicio": novo_horario_inicio,
            "horario_fim": novo_horario_fim,
        }

        request = factory.patch(f"/api/reservas/areas/{self.reserva_area.pk}/", payload, format="json")
        force_authenticate(request, user=self.professor)
        response = ReservaAreaDetailView.as_view()(request, pk=self.reserva_area.pk)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.reserva_area.refresh_from_db()
        self.assertEqual(self.reserva_area.nome, "Reserva Estudo Editada")
        self.assertEqual(str(self.reserva_area.horario_inicio), novo_horario_inicio)

        # Notificação criada para o aluno
        notificacao = Notificacao.objects.filter(
            usuario=self.aluno,
            reserva=self.reserva_area,
            tipo=TipoNotificacao.ALTERACAO_RESERVA,
        ).first()
        self.assertIsNotNone(notificacao)
        self.assertIn("Prof. Silva", notificacao.mensagem)

        # Auditoria registrada para o servidor
        log = LogAuditoria.objects.filter(
            responsavel=self.professor,
            acao=AcaoAuditoria.EDITAR,
            objeto_id=self.reserva_area.pk,
        ).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.perfil_responsavel, Papel.SERVIDOR)
        self.assertEqual(log.usuario_afetado, self.aluno)

    def test_professor_pode_cancelar_reserva_aluno_grava_cancelada_por(self):
        factory = APIRequestFactory()
        payload = {"status": StatusReserva.CANCELADA}

        request = factory.patch(f"/api/reservas/areas/{self.reserva_area.pk}/", payload, format="json")
        force_authenticate(request, user=self.professor)
        response = ReservaAreaDetailView.as_view()(request, pk=self.reserva_area.pk)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.reserva_area.refresh_from_db()
        self.assertEqual(self.reserva_area.status, StatusReserva.CANCELADA)
        self.assertEqual(self.reserva_area.cancelada_por, self.professor)
        self.assertIsNotNone(self.reserva_area.cancelada_em)

        # Notificação criada para o aluno
        notificacao = Notificacao.objects.filter(
            usuario=self.aluno,
            reserva=self.reserva_area,
            tipo=TipoNotificacao.CANCELAMENTO_RESERVA,
        ).first()
        self.assertIsNotNone(notificacao)
        self.assertIn("Prof. Silva", notificacao.mensagem)

    def test_listar_reservas_do_grupo(self):
        factory = APIRequestFactory()
        request = factory.get(f"/api/grupos/{self.grupo.pk}/reservas/")
        force_authenticate(request, user=self.professor)
        response = ReservasGrupoListView.as_view()(request, pk=self.grupo.pk)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        nomes = [item["nome"] for item in response.data["results"]]
        self.assertIn("Reserva Estudo", nomes)
        self.assertIn("Reserva Projetor", nomes)

        # Outro professor não tem acesso
        request_outro = factory.get(f"/api/grupos/{self.grupo.pk}/reservas/")
        force_authenticate(request_outro, user=self.outro_professor)
        response_outro = ReservasGrupoListView.as_view()(request_outro, pk=self.grupo.pk)
        self.assertEqual(response_outro.status_code, status.HTTP_403_FORBIDDEN)

        # Verifica que usuario_detalhe com nome do aluno vem em todas as modalidades
        for item in response.data["results"]:
            self.assertEqual(item["usuario_detalhe"]["nome"], "João Aluno")

    def test_professor_nao_gerencia_modalidade_ou_tipo_recurso_nao_autorizado_pelo_seu_grupo(self):
        outro_tipo = TipoRecurso.objects.create(descricao="Esportes")
        bola = RecursoGeral.objects.create(
            nome="Bola de Vôlei",
            tipo_recurso=outro_tipo,
            tipo_prazo="CURTO",
            quantidade_total=3,
            status="ATIVO",
        )
        # Outro professor autoriza "Esportes" para o mesmo aluno
        grupo_outro_prof = Grupo.objects.create(
            nome="Atletismo",
            tipo_membro_permitido=Papel.ALUNO,
            data_inicio_validade=self.hoje - timedelta(days=5),
            data_fim_validade=self.hoje + timedelta(days=30),
            criador=self.outro_professor,
        )
        AutorizacaoGrupo.objects.create(
            grupo=grupo_outro_prof,
            tipo_recurso_autorizado=TipoRecursoReservavel.RECURSO_GERAL,
            tipo_recurso=outro_tipo,
        )
        MembroGrupo.objects.create(grupo=grupo_outro_prof, usuario=self.aluno)

        reserva_bola = ReservaRecursoGeral.objects.create(
            nome="Treino de Vôlei",
            descricao="Quadra",
            status=StatusReserva.CONFIRMADA,
            data=self.dia,
            horario_inicio=time(16, 0),
            horario_fim=time(18, 0),
            data_devolucao_prevista=self.dia,
            tipo_reserva="INTERNA",
            usuario=self.aluno,
            recurso_geral=bola,
            quantidades=1,
        )

        # self.professor autorizou apenas Área e Projetores, NÃO Esportes
        self.assertFalse(autor_grupo_gerencia_reserva(self.professor, reserva_bola))
        # self.outro_professor autorizou Esportes, mas NÃO Área
        self.assertTrue(autor_grupo_gerencia_reserva(self.outro_professor, reserva_bola))
        self.assertFalse(autor_grupo_gerencia_reserva(self.outro_professor, self.reserva_area))

        # self.professor não pode editar sua reserva de Projetor trocando para Bola (outro tipo)
        factory = APIRequestFactory()
        request = factory.patch(
            f"/api/reservas/recursos-gerais/{self.reserva_recurso.pk}/",
            {"recurso_geral": bola.pk},
            format="json",
        )
        force_authenticate(request, user=self.professor)
        response = ReservaRecursoGeralDetailView.as_view()(request, pk=self.reserva_recurso.pk)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_professor_cancela_recorrencia_aluno_grava_cancelada_por(self):
        recorrencia = Recorrencia.objects.create(
            tipo="SEMANAL",
            data_inicio=self.dia,
            data_fim=self.dia + timedelta(days=7),
            usuario=self.aluno,
        )
        r1 = ReservaArea.objects.create(
            nome="Série Estudo",
            descricao="Grupo",
            status=StatusReserva.CONFIRMADA,
            data=self.dia,
            horario_inicio=time(8, 0),
            horario_fim=time(10, 0),
            tipo_reserva="INTERNA",
            usuario=self.aluno,
            area=self.area,
            recorrencia=recorrencia,
        )
        r2 = ReservaArea.objects.create(
            nome="Série Estudo",
            descricao="Grupo",
            status=StatusReserva.CONFIRMADA,
            data=self.dia + timedelta(days=7),
            horario_inicio=time(8, 0),
            horario_fim=time(10, 0),
            tipo_reserva="INTERNA",
            usuario=self.aluno,
            area=self.area,
            recorrencia=recorrencia,
        )

        factory = APIRequestFactory()
        request = factory.patch(
            f"/api/reservas/areas/recorrencias/{recorrencia.pk}/",
            {"status": StatusReserva.CANCELADA},
            format="json",
        )
        force_authenticate(request, user=self.professor)
        response = RecorrenciaReservaAreaDetailView.as_view()(request, pk=recorrencia.pk)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        r1.refresh_from_db()
        r2.refresh_from_db()
        self.assertEqual(r1.status, StatusReserva.CANCELADA)
        self.assertEqual(r1.cancelada_por, self.professor)
        self.assertIsNotNone(r1.cancelada_em)
        self.assertEqual(r2.cancelada_por, self.professor)
