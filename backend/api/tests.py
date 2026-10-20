import uuid
from datetime import date, time, timedelta
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from accounts.enumerations import Papel
from accounts.models import HubUser
from api.enumerations import TipoRecorrencia
from api.enumerations.status_reserva import StatusReserva
from api.enumerations.tipo_reserva import TipoReserva
from api.enumerations.timetable_enumerations.dia_semana_enum import DiaSemana
from api.models import Area, Bloco, ReservaArea
from api.models.timetable import CelulaTimetable, HorarioTimetable, PeriodoLetivo
from api.services.timetable.reservas_timetable_service import ReservasTimetableService
from api.validators.reserva_area_validator import validar_disponibilidade_area
from api.views.reserva_area_view import ReservaAreaDetailView, ReservaAreaListCreateView


class TimetableReservasTestCase(TestCase):
    def setUp(self):
        self.admin = HubUser.objects.create(
            id=uuid.uuid4(),
            nome="Admin Teste",
            email="admin.teste@ifrs.edu.br",
            papel=Papel.ADMIN,
            is_active=True,
        )
        self.bloco = Bloco.objects.create(numero="5", nome="Bloco 5")
        self.area = Area.objects.create(
            nome="516",
            bloco=self.bloco,
            capacidade=30,
            disponibilidade=True,
        )
        self.periodo = PeriodoLetivo.objects.create(
            nome="2026/2",
            data_inicio=date(2026, 8, 3),  # Segunda-feira
            data_fim=date(2026, 8, 31),   # Segunda-feira (5 semanas: 3, 10, 17, 24, 31)
            ativo=True,
        )
        self.horario = HorarioTimetable.objects.create(
            edupage_id=1,
            horario_inicio=time(7, 30),
            horario_fim=time(9, 10),
        )
        self.celula = CelulaTimetable.objects.create(
            area=self.area,
            periodo_letivo=self.periodo,
            horario=self.horario,
            horario_inicio=time(7, 30),
            horario_fim=time(9, 10),
            disciplina="Artes",
            turma="111",
            professor="Professora Angela",
            dia_semana=DiaSemana.SEGUNDA.value,
            duracao_periodos=2,
            edupage_card_id="*1",
        )

    def test_gerar_reservas_cria_apenas_uma_por_celula_e_projeta_virtualmente(self):
        total = ReservasTimetableService.gerar_reservas_das_celulas([self.celula], usuario=self.admin)
        # Apenas 1 registro físico por célula no banco (1 semana base)
        self.assertEqual(total, 1)
        self.assertEqual(ReservaArea.objects.count(), 1)

        reserva_base = ReservaArea.objects.first()
        self.assertTrue(reserva_base.aula)
        self.assertEqual(reserva_base.status, StatusReserva.CONFIRMADA)
        self.assertEqual(reserva_base.tipo_reserva, TipoReserva.INTERNA)
        self.assertEqual(reserva_base.data, date(2026, 8, 3))
        self.assertIsNotNone(reserva_base.recorrencia)
        self.assertEqual(reserva_base.recorrencia.tipo, TipoRecorrencia.SEMANAL)

        # Projeção virtual via endpoint de listagem do calendário para todo o mês
        factory = APIRequestFactory()
        request = factory.get("/api/reservas-area/?data_inicio=2026-08-03&data_fim=2026-08-31")
        force_authenticate(request, user=self.admin)

        view = ReservaAreaListCreateView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 5)

        datas_retornadas = sorted([item["data"] for item in response.data])
        datas_esperadas = [
            "2026-08-03",
            "2026-08-10",
            "2026-08-17",
            "2026-08-24",
            "2026-08-31",
        ]
        self.assertEqual(datas_retornadas, datas_esperadas)

    def test_idempotencia_e_limpeza_de_cadastros_antigos_duplicados(self):
        # Simula dados duplicados da lógica antiga (várias reservas físicas para a mesma célula)
        for offset in (0, 7, 14):
            ReservaArea.objects.create(
                nome="Artes (111)",
                status=StatusReserva.CONFIRMADA,
                data=date(2026, 8, 3) + timedelta(days=offset),
                horario_inicio=time(7, 30),
                horario_fim=time(9, 10),
                duracao=timedelta(minutes=100),
                tipo_reserva=TipoReserva.INTERNA,
                usuario=self.admin,
                area=self.area,
                aula=True,
                celula_timetable=self.celula,
            )
        self.assertEqual(ReservaArea.objects.count(), 3)

        # Ao garantir reservas base ou regerar, deve limpar as 3 antigas e deixar apenas 1
        limpou = ReservasTimetableService.garantir_apenas_reservas_base()
        self.assertTrue(limpou)
        self.assertEqual(ReservaArea.objects.count(), 1)

    def test_bloqueio_de_conflito_para_reserva_avulsa_em_semanas_futuras(self):
        ReservasTimetableService.gerar_reservas_das_celulas([self.celula], usuario=self.admin)
        self.assertEqual(ReservaArea.objects.count(), 1)

        # Tenta reservar na semana seguinte (10/08), que é projetada pela recorrência da timetable
        dados_conflitantes = {
            "area": self.area,
            "data": date(2026, 8, 10),
            "horario_inicio": time(8, 0),
            "horario_fim": time(9, 0),
        }
        with self.assertRaises(Exception):
            validar_disponibilidade_area(dados_conflitantes)

    def test_reserva_timetable_nao_pode_ser_alterada_ou_cancelada_manualmente(self):
        ReservasTimetableService.gerar_reservas_das_celulas([self.celula], usuario=self.admin)
        reserva = ReservaArea.objects.filter(celula_timetable=self.celula).first()

        factory = APIRequestFactory()
        request = factory.patch(f"/api/reservas-area/{reserva.pk}/", {"status": "CANCELADA"}, format="json")
        force_authenticate(request, user=self.admin)

        view = ReservaAreaDetailView.as_view()
        response = view(request, pk=reserva.pk)

        self.assertEqual(response.status_code, 400)
        self.assertIn("Aulas da grade horária (Timetable)", response.data["detail"])
