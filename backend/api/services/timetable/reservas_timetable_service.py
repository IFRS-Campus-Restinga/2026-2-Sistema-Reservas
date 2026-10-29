import copy
import uuid
from datetime import datetime, timedelta
from django.db import transaction
from django.db.models import Count

from accounts.enumerations import Papel
from accounts.models.hub_user import HubUser
from api.enumerations import TipoRecorrencia
from api.enumerations.status_reserva import StatusReserva
from api.enumerations.tipo_reserva import TipoReserva
from api.enumerations.timetable_enumerations.dia_semana_enum import DiaSemana
from api.models.recorrencia_model import Recorrencia
from api.models.reserva_area_model import ReservaArea
from api.models.timetable.celula_timetable_model import CelulaTimetable


MAPA_DIAS_SEMANA = {
    DiaSemana.SEGUNDA.value: 0,
    DiaSemana.TERCA.value: 1,
    DiaSemana.QUARTA.value: 2,
    DiaSemana.QUINTA.value: 3,
    DiaSemana.SEXTA.value: 4,
    DiaSemana.SABADO.value: 5,
    DiaSemana.DOMINGO.value: 6,
}


class ReservasTimetableService:
    """
    Serviço encarregado de converter as aulas semanais (CelulaTimetable)
    em reservas base (1 semana = 1 registro por aula) com recorrência semanal
    e projetá-las virtualmente para qualquer semana do semestre letivo.
    """

    @staticmethod
    def obter_usuario_responsavel(usuario=None):
        """
        Retorna o usuário responsável pelas reservas automáticas da Timetable.
        Sempre utiliza um usuário institucional de sistema dedicado (EduPage / Timetable),
        garantindo que as reservas da grade horária não fiquem atribuídas ao administrador
        ou usuário que acionou a sincronização.
        """
        usuario_sistema, _ = HubUser.objects.get_or_create(
            email="timetable.sistema@ifrs.edu.br",
            defaults={
                "id": uuid.uuid4(),
                "nome": "EduPage (Timetable)",
                "perfil_acesso": "servidor",
                "papel": Papel.ADMIN,
                "is_active": False,
            },
        )
        if usuario_sistema.nome != "EduPage (Timetable)":
            usuario_sistema.nome = "EduPage (Timetable)"
            usuario_sistema.save(update_fields=["nome"])

        return usuario_sistema

    @classmethod
    @transaction.atomic
    def limpar_reservas_timetable(cls, periodos_ids=None):
        """
        Remove todas as reservas de área vinculadas à Timetable (incluindo
        eventuais cadastros antigos duplicados do semestre inteiro) e limpa
        as recorrências órfãs.
        """
        qs = ReservaArea.objects.filter(celula_timetable__isnull=False)
        if periodos_ids:
            qs = qs.filter(celula_timetable__periodo_letivo_id__in=periodos_ids)

        recorrencias_ids = set(
            qs.exclude(recorrencia__isnull=True).values_list("recorrencia_id", flat=True)
        )
        removidas, _ = qs.delete()

        if recorrencias_ids:
            Recorrencia.objects.filter(id__in=recorrencias_ids, reservas__isnull=True).delete()

        return removidas

    @classmethod
    @transaction.atomic
    def gerar_reservas_das_celulas(cls, celulas, usuario=None):
        """
        Para cada CelulaTimetable informada, gera APENAS 1 instância base de ReservaArea
        (referente à primeira semana do período letivo) vinculada a uma Recorrência Semanal
        que dura até o fim do semestre.
        Remove previamente quaisquer registros antigos dos períodos correspondentes para evitar duplicatas.
        """
        if not celulas:
            return 0

        periodos_ids = {
            c.periodo_letivo_id for c in celulas if c.periodo_letivo_id is not None
        }
        if periodos_ids:
            cls.limpar_reservas_timetable(periodos_ids)

        usuario_responsavel = cls.obter_usuario_responsavel(usuario)
        recorrencias_por_periodo = {}
        total_criadas = 0

        for celula in celulas:
            weekday_alvo = MAPA_DIAS_SEMANA.get(celula.dia_semana)
            if weekday_alvo is None:
                continue

            periodo = celula.periodo_letivo
            if not periodo or not periodo.data_inicio or not periodo.data_fim:
                continue

            if periodo.id not in recorrencias_por_periodo:
                recorrencias_por_periodo[periodo.id] = Recorrencia.objects.create(
                    tipo=TipoRecorrencia.SEMANAL,
                    data_inicio=periodo.data_inicio,
                    data_fim=periodo.data_fim,
                    usuario=usuario_responsavel,
                )

            recorrencia = recorrencias_por_periodo[periodo.id]

            # Calcula apenas a data da primeira semana do semestre para este dia da semana
            dias_ate_primeiro = (weekday_alvo - periodo.data_inicio.weekday()) % 7
            data_base = periodo.data_inicio + timedelta(days=dias_ate_primeiro)

            if data_base > periodo.data_fim:
                continue

            turma_str = f" ({celula.turma})" if celula.turma else ""
            nome_base = f"{celula.disciplina}{turma_str}".strip()
            if len(nome_base) > 50:
                nome_formatado = nome_base[:50]
            elif len(nome_base) < 5:
                nome_formatado = f"Aula {nome_base}"[:50]
            else:
                nome_formatado = nome_base

            prof_nome = celula.professor or "Não informado"
            descricao_formatada = (
                f"Aula regular: {celula.disciplina} | Turma: {celula.turma or 'Geral'} | Prof: {prof_nome}"
            )[:255]

            duracao = datetime.combine(data_base, celula.horario_fim) - datetime.combine(
                data_base, celula.horario_inicio
            )

            ReservaArea.objects.create(
                nome=nome_formatado,
                descricao=descricao_formatada,
                status=StatusReserva.CONFIRMADA,
                data=data_base,
                horario_inicio=celula.horario_inicio,
                horario_fim=celula.horario_fim,
                duracao=duracao,
                tipo_reserva=TipoReserva.INTERNA,
                usuario=usuario_responsavel,
                area=celula.area,
                aula=True,
                recorrencia=recorrencia,
                celula_timetable=celula,
            )
            total_criadas += 1

        return total_criadas

    @classmethod
    def garantir_apenas_reservas_base(cls):
        """
        Verifica se o banco possui dados legados duplicados (ex: 9.510 reservas físicas
        para as mesmas 360 células) ou se existem células sem reserva base criada.
        Se detectar duplicatas, reconstrói automaticamente deixando apenas 1 registro por célula (360).
        """
        tem_duplicadas = (
            ReservaArea.objects.filter(celula_timetable__isnull=False)
            .values("celula_timetable_id")
            .annotate(total=Count("id"))
            .filter(total__gt=1)
            .exists()
        )
        if tem_duplicadas:
            celulas = list(
                CelulaTimetable.objects.select_related("area", "periodo_letivo", "horario").all()
            )
            cls.gerar_reservas_das_celulas(celulas)
            return True
        return False

    @classmethod
    def projetar_reservas_no_intervalo(cls, data_inicio=None, data_fim=None, area=None):
        """
        Retorna as reservas da Timetable projetadas virtualmente para o intervalo
        [data_inicio, data_fim].
        Se nenhum intervalo for informado, retorna apenas os registros base (1 semana).
        """
        qs = ReservaArea.objects.filter(
            status=StatusReserva.CONFIRMADA,
            celula_timetable__isnull=False,
        )
        if area is not None:
            qs = qs.filter(area=area)

        reservas_base = list(
            qs.select_related(
                "area__bloco",
                "usuario",
                "recorrencia",
                "celula_timetable__periodo_letivo",
            )
            .order_by("horario_inicio")
        )

        if data_inicio is None and data_fim is None:
            return reservas_base

        projetadas = []

        for reserva in reservas_base:
            projetadas.extend(cls.projetar_reserva(reserva, data_inicio, data_fim))

        return projetadas

    @staticmethod
    def projetar_reserva(reserva, data_inicio, data_fim):
        """Projeta uma reserva base sem alterar o registro persistido."""
        periodo = reserva.celula_timetable.periodo_letivo
        ini = max(periodo.data_inicio, data_inicio) if data_inicio else periodo.data_inicio
        fim = min(periodo.data_fim, data_fim) if data_fim else periodo.data_fim
        weekday = MAPA_DIAS_SEMANA.get(reserva.celula_timetable.dia_semana, reserva.data.weekday())
        dia = ini + timedelta(days=(weekday - ini.weekday()) % 7)
        while dia <= fim:
            ocorrencia = copy.copy(reserva)
            ocorrencia.data = dia
            yield ocorrencia
            dia += timedelta(days=7)
