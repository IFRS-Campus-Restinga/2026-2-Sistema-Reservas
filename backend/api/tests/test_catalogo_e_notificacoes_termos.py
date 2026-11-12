from datetime import timedelta
from uuid import uuid4

from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from accounts.models import HubUser
from api.enumerations import StatusReserva, TipoTermo
from api.enumerations.status_termo import StatusTermo
from api.enumerations.tipo_notificacao import TipoNotificacao
from api.enumerations.tipo_recurso_reservavel import TipoRecursoReservavel
from api.models import AutorizacaoGrupo, Grupo, MembroGrupo, Reserva, ReservaVeiculo, TermoResponsabilidade, Veiculo
from api.models.notificacao_model import Notificacao
from api.models.tipo_recurso_model import TipoRecurso
from api.services.notificacao_service import (
    criar_notificacao_termo_operacional_analisado, criar_notificacao_termo_operacional_enviado,
)
from api.services.termo_service import analisar_termo
from api.views.notificacao_view import MinhasNotificacoesListView
from api.views.tipo_recurso_view import TipoRecursoCreateView
from .base_revisao import BaseRevisaoTests


def criar_usuario(papel):
    return HubUser.objects.create(
        id=uuid4(), email=f'{papel}@example.test', nome=papel.title(), papel=papel, is_active=True,
    )


class CatalogoPorPermissaoTests(BaseRevisaoTests):
    def setUp(self):
        super().setUp()
        self.tipo_esporte = TipoRecurso.objects.create(descricao='Esportes')
        self.recurso()
        self.recurso(nome='Bola', tipo_recurso=self.tipo_esporte)

    def catalogo(self, usuario):
        request = APIRequestFactory().get('/', {'catalogo': 'true'})
        force_authenticate(request, user=usuario)
        resposta = TipoRecursoCreateView.as_view()(request)
        self.assertEqual(resposta.status_code, 200)
        return {item['descricao'] for item in resposta.data['results']}

    def autorizar_aluno(self, aluno, tipo):
        grupo = Grupo.objects.create(
            nome='Grupo teste', tipo_membro_permitido='aluno', criador=self.usuario,
            data_inicio_validade=timezone.localdate() - timedelta(days=1),
        )
        AutorizacaoGrupo.objects.create(
            grupo=grupo, tipo_recurso_autorizado=TipoRecursoReservavel.RECURSO_GERAL, tipo_recurso=tipo,
        )
        MembroGrupo.objects.create(grupo=grupo, usuario=aluno)

    def test_admin_e_servidor_veem_todos_os_tipos(self):
        todos = {'Equipamentos', 'Esportes'}
        self.assertEqual(self.catalogo(self.usuario), todos)
        self.assertEqual(self.catalogo(criar_usuario('servidor')), todos)

    def test_aluno_sem_grupo_e_convidado_nao_veem_nada(self):
        self.assertEqual(self.catalogo(criar_usuario('aluno')), set())
        self.assertEqual(self.catalogo(criar_usuario('convidado')), set())

    def test_aluno_ve_apenas_tipos_autorizados_pelo_grupo(self):
        aluno = criar_usuario('aluno')
        self.autorizar_aluno(aluno, self.tipo_esporte)
        self.assertEqual(self.catalogo(aluno), {'Esportes'})


class NotificacoesTermosVeiculoTests(BaseRevisaoTests):
    def setUp(self):
        super().setUp()
        self.servidor = criar_usuario('servidor')
        veiculo = Veiculo.objects.create(nome='Carro', placa='ABC1234', marca='Marca',
            modelo='Modelo', capacidade=5, combustivel='Gasolina', quilometragem=0, cor='Branco')
        dados = self.dados()
        dados['usuario'] = self.servidor
        self.reserva = ReservaVeiculo.objects.create(veiculo=veiculo, destino='Campus', finalidade='Visita',
            quantidade_passageiros=2, data_devolucao_prevista=self.dia, **dados)

    def termo(self, tipo, status=StatusTermo.PENDENTE):
        return TermoResponsabilidade.objects.create(reserva=self.reserva, tipo=tipo, status=status,
            enviado_por=self.servidor, nome_original='termo.pdf')

    def tipos_do_admin(self):
        return set(Notificacao.objects.filter(usuario=self.usuario).values_list('tipo', flat=True))

    def test_envio_e_reenvio_notificam_admin_sem_colidir_entre_documentos(self):
        criar_notificacao_termo_operacional_enviado(self.termo(TipoTermo.RETIRADA_VEICULO))
        self.reserva.termos.update(atual=False)
        criar_notificacao_termo_operacional_enviado(self.termo(TipoTermo.DEVOLUCAO_VEICULO), reenviado=True)
        self.assertEqual(self.tipos_do_admin(), {
            TipoNotificacao.RETIRADA_ENVIADA, TipoNotificacao.DEVOLUCAO_REENVIADA,
        })

    def test_analise_notifica_o_responsavel_da_reserva(self):
        criar_notificacao_termo_operacional_analisado(self.reserva, TipoTermo.RETIRADA_VEICULO, StatusTermo.APROVADO)
        criar_notificacao_termo_operacional_analisado(
            self.reserva, TipoTermo.DEVOLUCAO_VEICULO, StatusTermo.REJEITADO, 'Foto ilegível')
        notificacoes = Notificacao.objects.filter(usuario=self.servidor)
        self.assertEqual(set(notificacoes.values_list('tipo', flat=True)), {
            TipoNotificacao.RETIRADA_APROVADA, TipoNotificacao.DEVOLUCAO_REJEITADA,
        })
        self.assertIn('Foto ilegível', notificacoes.get(tipo=TipoNotificacao.DEVOLUCAO_REJEITADA).mensagem)

    def analisar_devolucao(self, decisao, motivo=''):
        Reserva.objects.filter(pk=self.reserva.pk).update(status=StatusReserva.AGUARDANDO_TERMO_DEVOLUCAO)
        self.termo(TipoTermo.RETIRADA_VEICULO, StatusTermo.APROVADO)
        termo = self.termo(TipoTermo.DEVOLUCAO_VEICULO)
        reserva = Reserva.objects.get(pk=self.reserva.pk)
        analisar_termo(reserva, termo.pk, self.usuario, decisao, motivo, TipoTermo.DEVOLUCAO_VEICULO)

    def test_aprovar_devolucao_conclui_e_notifica(self):
        self.analisar_devolucao(StatusTermo.APROVADO)
        self.assertEqual(Reserva.objects.get(pk=self.reserva.pk).status, StatusReserva.CONCLUIDA)
        self.assertTrue(Notificacao.objects.filter(
            usuario=self.servidor, tipo=TipoNotificacao.DEVOLUCAO_APROVADA).exists())

    def test_notificacao_expoe_documento_e_motivo_do_termo_correto(self):
        self.analisar_devolucao(StatusTermo.REJEITADO, 'Faltou assinatura')
        # um termo de retirada rejeitado antes, com outro motivo, não pode ser confundido com o da devolução
        TermoResponsabilidade.objects.filter(tipo=TipoTermo.RETIRADA_VEICULO).update(
            status=StatusTermo.REJEITADO, motivo_rejeicao='Motivo da retirada', atual=False)
        request = APIRequestFactory().get('/')
        force_authenticate(request, user=self.servidor)
        resposta = MinhasNotificacoesListView.as_view()(request)
        self.assertEqual(resposta.status_code, 200)
        item = next(n for n in resposta.data['results'] if n['tipo'] == TipoNotificacao.DEVOLUCAO_REJEITADA)
        self.assertEqual(item['termo_tipo'], 'devolucao')
        self.assertEqual(item['motivo_rejeicao_termo'], 'Faltou assinatura')
