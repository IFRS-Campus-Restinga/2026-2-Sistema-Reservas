import uuid
from datetime import date, time
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from accounts.enumerations import Papel
from accounts.models import HubUser
from api.enumerations.status_reserva import StatusReserva
from api.enumerations.tipo_reserva import TipoReserva
from api.enumerations.timetable_enumerations.dia_semana_enum import DiaSemana
from api.models import Area, Bloco, ReservaArea
from api.models.timetable import CelulaTimetable, HorarioTimetable, PeriodoLetivo
from api.services.timetable.reservas_timetable_service import ReservasTimetableService
from api.validators.reserva_area_validator import validar_disponibilidade_area
from api.views.reserva_area_view import ReservaAreaDetailView


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

    def test_gerar_reservas_expande_datas_corretamente(self):
        total = ReservasTimetableService.gerar_reservas_das_celulas([self.celula], usuario=self.admin)
        self.assertEqual(total, 5)

        reservas = ReservaArea.objects.filter(celula_timetable=self.celula).order_by("data")
        self.assertEqual(reservas.count(), 5)

        datas_esperadas = [
            date(2026, 8, 3),
            date(2026, 8, 10),
            date(2026, 8, 17),
            date(2026, 8, 24),
            date(2026, 8, 31),
        ]
        self.assertEqual(list(reservas.values_list("data", flat=True)), datas_esperadas)

        for r in reservas:
            self.assertTrue(r.aula)
            self.assertEqual(r.status, StatusReserva.CONFIRMADA)
            self.assertEqual(r.tipo_reserva, TipoReserva.INTERNA)
            self.assertEqual(r.area, self.area)
            self.assertEqual(r.horario_inicio, time(7, 30))
            self.assertEqual(r.horario_fim, time(9, 10))

    def test_idempotencia_ao_gerar_novamente(self):
        ReservasTimetableService.gerar_reservas_das_celulas([self.celula], usuario=self.admin)
        self.assertEqual(ReservaArea.objects.count(), 5)

        # Ao rodar novamente para a mesma célula, não deve duplicar
        ReservasTimetableService.gerar_reservas_das_celulas([self.celula], usuario=self.admin)
        self.assertEqual(ReservaArea.objects.count(), 5)

    def test_bloqueio_de_conflito_para_reserva_avulsa(self):
        ReservasTimetableService.gerar_reservas_das_celulas([self.celula], usuario=self.admin)

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
