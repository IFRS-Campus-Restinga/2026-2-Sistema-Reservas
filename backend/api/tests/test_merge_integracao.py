from datetime import timedelta, time
from unittest.mock import patch
from django.test import override_settings
from rest_framework.exceptions import ValidationError
from rest_framework.test import APIRequestFactory
from .base_revisao import BaseRevisaoTests
from api.models.timetable.celula_timetable_model import CelulaTimetable
from api.models.timetable.periodo_letivo_model import PeriodoLetivo
from api.models.timetable.horario_timetable_model import HorarioTimetable
from api.models.reserva_area_model import ReservaArea
from api.models.recorrencia_model import Recorrencia
from api.services.timetable.reservas_timetable_service import ReservasTimetableService
from api.services.opcoes_disponibilidade_service import opcoes_area
from api.services.relatorio_uso_service import gerar_relatorio
from api.validators.reserva_area_validator import validar_disponibilidade_area
from api.views.minhas_reservas_view import MinhasReservasListView
from api.views.reserva_area_view import ReservaAreaListCreateView
from hub_integrations.views.demonstracao import entrar_demonstracao

class MergeTests(BaseRevisaoTests):
    def criar_grade(self):
        inicio = self.dia - timedelta(days=14)
        periodo = PeriodoLetivo.objects.create(nome='Teste merge', data_inicio=inicio, data_fim=self.dia+timedelta(days=14))
        horario = HorarioTimetable.objects.create(edupage_id=1, horario_inicio=time(8), horario_fim=time(9))
        celula = CelulaTimetable.objects.create(area=self.area, periodo_letivo=periodo, horario=horario,
            horario_inicio=time(8), horario_fim=time(9), disciplina='Disciplina teste', turma='Turma',
            dia_semana=['SEG','TER','QUA','QUI','SEX','SAB','DOM'][self.dia.weekday()])
        ReservasTimetableService.gerar_reservas_das_celulas([celula])
        return celula

    def test_grade_bloqueia_calendario_e_gravacao_em_semana_projetada(self):
        self.criar_grade()
        self.assertEqual(ReservaArea.objects.count(), 1)
        self.assertNotIn('08:00', opcoes_area(self.area.pk, self.dia.year, self.dia.month)[str(self.dia)])
        with self.assertRaises(ValidationError):
            validar_disponibilidade_area(dict(area=self.area, **self.dados()))
        dados = dict(area=self.area, **self.dados())
        dados['data'] += timedelta(days=21)
        validar_disponibilidade_area(dados)

    def test_relatorio_conta_ocorrencias_sem_duplicar_base(self):
        self.criar_grade()
        inicio = self.dia-timedelta(days=14)
        resultado = gerar_relatorio({'modalidade':'area'}, inicio, self.dia+timedelta(days=14))
        self.assertEqual(resultado['resumo']['total_reservas'], 5)
        self.assertEqual(resultado['resumo']['total_horas'], 5)
        resultado = gerar_relatorio({'modalidade':'area'}, self.dia, self.dia)
        self.assertEqual(resultado['resumo']['total_reservas'], 1)
        self.assertEqual(resultado['resultados'][0]['data'], self.dia)

    def test_limite_relatorio_inclui_ocorrencias_virtuais(self):
        self.criar_grade()
        with patch('api.services.relatorio_uso_service.LIMITE_REGISTROS', 1):
            with self.assertRaises(ValidationError):
                gerar_relatorio({}, self.dia, self.dia+timedelta(days=14))

    def test_calendario_retorna_aula_projetada(self):
        self.criar_grade()
        resposta = self.resposta(ReservaAreaListCreateView, {'data_inicio':str(self.dia),'data_fim':str(self.dia)})
        self.assertEqual(resposta.status_code, 200)
        self.assertEqual(len(resposta.data), 1)
        self.assertEqual(resposta.data[0]['data'], str(self.dia))

    def test_recorrencia_nao_e_dividida_pela_paginacao(self):
        serie = Recorrencia.objects.create(tipo='SEMANAL',data_inicio=self.dia,
            data_fim=self.dia+timedelta(days=21),usuario=self.usuario)
        for i in range(4):
            dados=self.dados();dados['data'] += timedelta(days=7*i)
            ReservaArea.objects.create(area=self.area, recorrencia=serie,status='CONFIRMADA',**dados)
        resposta=self.resposta(MinhasReservasListView,{'agrupar_recorrencias':'true','page_size':1})
        self.assertEqual(resposta.status_code,200)
        self.assertEqual(resposta.data['count'],1)
        self.assertEqual(len(resposta.data['results'][0]['ocorrencias']),4)
        self.assertEqual(resposta.data['results'][0]['data'],str(self.dia))
        resposta=self.resposta(MinhasReservasListView,{'page_size':1})
        self.assertEqual(resposta.data['count'],4)

    @override_settings(MODO_DEMONSTRACAO=False)
    def test_demo_desativada_nao_permite_entrar(self):
        resposta=entrar_demonstracao(APIRequestFactory().post('/'),perfil='admin')
        self.assertEqual(resposta.status_code,404)

    @override_settings(MODO_DEMONSTRACAO=True)
    def test_demo_perfis_e_cookie(self):
        for perfil in ('admin','servidor','aluno','convidado'):
            resposta=entrar_demonstracao(APIRequestFactory().post('/'),perfil=perfil)
            self.assertEqual(resposta.status_code,200)
            self.assertTrue(resposta.cookies)
        resposta=entrar_demonstracao(APIRequestFactory().post('/'),perfil='invalido')
        self.assertEqual(resposta.status_code,400)

    def test_recorrencia_timetable_nao_pode_ser_cancelada(self):
        from api.views.recorrencia_view import RecorrenciaReservaAreaDetailView
        from rest_framework.test import force_authenticate
        self.criar_grade()
        serie=ReservaArea.objects.get().recorrencia
        request=APIRequestFactory().patch('/', {'status':'CANCELADA'},format='json')
        force_authenticate(request,user=self.usuario)
        resposta=RecorrenciaReservaAreaDetailView.as_view()(request,pk=serie.pk)
        self.assertEqual(resposta.status_code,400)
        self.assertEqual(ReservaArea.objects.get().status,'CONFIRMADA')

    def test_recorrencia_manual_pode_ser_cancelada(self):
        from api.views.recorrencia_view import RecorrenciaReservaAreaDetailView
        from rest_framework.test import force_authenticate
        serie=Recorrencia.objects.create(tipo='SEMANAL',data_inicio=self.dia,
            data_fim=self.dia+timedelta(days=7),usuario=self.usuario)
        reserva=ReservaArea.objects.create(area=self.area,recorrencia=serie,status='CONFIRMADA',**self.dados())
        request=APIRequestFactory().patch('/',{'status':'CANCELADA'},format='json')
        force_authenticate(request,user=self.usuario)
        resposta=RecorrenciaReservaAreaDetailView.as_view()(request,pk=serie.pk)
        self.assertEqual(resposta.status_code,200)
        reserva.refresh_from_db()
        self.assertEqual(reserva.status,'CANCELADA')
