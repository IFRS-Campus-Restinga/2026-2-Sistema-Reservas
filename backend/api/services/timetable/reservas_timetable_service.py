import uuid
from datetime import datetime, timedelta
from django.db import transaction

from accounts.enumerations import Papel
from accounts.models.hub_user import HubUser
from api.enumerations.status_reserva import StatusReserva
from api.enumerations.tipo_reserva import TipoReserva
from api.enumerations.timetable_enumerations.dia_semana_enum import DiaSemana
from api.models.reserva_area_model import ReservaArea


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
    em reservas físicas (ReservaArea) distribuídas por todo o semestre letivo.
    """

    @staticmethod
    def obter_usuario_responsavel(usuario=None):
        """
        Retorna o usuário responsável pelas reservas automáticas da Timetable.
        Prioriza o usuário autenticado que disparou a ação, seguido por um Admin existente,
        ou cria um usuário de sistema dedicado.
        """
        if usuario and getattr(usuario, "is_authenticated", False):
            return usuario

        admin = HubUser.objects.filter(papel=Papel.ADMIN, is_active=True).first()
        if admin:
            return admin

        usuario_sistema, _ = HubUser.objects.get_or_create(
            email="timetable.sistema@ifrs.edu.br",
            defaults={
                "id": uuid.uuid4(),
                "nome": "Sistema EduPage / Timetable",
                "papel": Papel.ADMIN,
                "is_active": True,
            },
        )
        return usuario_sistema

    @classmethod
    @transaction.atomic
    def gerar_reservas_das_celulas(cls, celulas, usuario=None):
        """
        Para cada CelulaTimetable informada, gera as instâncias de ReservaArea
        para todas as semanas compreendidas no PeriodoLetivo vigente.
        Executado sob transação atômica para garantir consistência e performance.
        """
        if not celulas:
            return 0

        # Identifica os períodos letivos envolvidos e remove reservas anteriores
        # geradas pela timetable para garantir idempotência completa
        periodos_ids = {c.periodo_letivo_id for c in celulas if c.periodo_letivo_id}
        if periodos_ids:
            ReservaArea.objects.filter(celula_timetable__periodo_letivo_id__in=periodos_ids).delete()

        usuario_responsavel = cls.obter_usuario_responsavel(usuario)
        total_criadas = 0

        for celula in celulas:
            weekday_alvo = MAPA_DIAS_SEMANA.get(celula.dia_semana)
            if weekday_alvo is None:
                continue

            periodo = celula.periodo_letivo
            if not periodo or not periodo.data_inicio or not periodo.data_fim:
                continue

            # Calcula a primeira ocorrência do dia da semana a partir de data_inicio
            dias_ate_primeiro = (weekday_alvo - periodo.data_inicio.weekday()) % 7
            data_atual = periodo.data_inicio + timedelta(days=dias_ate_primeiro)

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

            duracao = datetime.combine(data_atual, celula.horario_fim) - datetime.combine(
                data_atual, celula.horario_inicio
            )

            while data_atual <= periodo.data_fim:
                ReservaArea.objects.create(
                    nome=nome_formatado,
                    descricao=descricao_formatada,
                    status=StatusReserva.CONFIRMADA,
                    data=data_atual,
                    horario_inicio=celula.horario_inicio,
                    horario_fim=celula.horario_fim,
                    duracao=duracao,
                    tipo_reserva=TipoReserva.INTERNA,
                    usuario=usuario_responsavel,
                    area=celula.area,
                    aula=True,
                    celula_timetable=celula,
                )
                total_criadas += 1
                data_atual += timedelta(days=7)

        return total_criadas
