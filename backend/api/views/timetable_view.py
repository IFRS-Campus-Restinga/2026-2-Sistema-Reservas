from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from api.permissions.escrita_admin import EscritaAdmin
from api.models.timetable.celula_timetable_model import CelulaTimetable
from api.services.timetable.estrutura_timetable_service import EstruturaTimetableService
from api.services.timetable.celulas_service import CelulasService


class TimetableView(APIView):
    """
    Endpoint para consulta e sincronização da grade horária (Timetable).
    - GET: Retorna a grade horária agrupada por Sala e Dia da Semana (leitura para usuários autenticados).
    - POST: Dispara a sincronização completa com o EduPage (restrito a Administradores via EscritaAdmin).
    """
    permission_classes = [EscritaAdmin]

    def get(self, request):
        # 1. Busca todas as células cadastradas no banco
        celulas = CelulaTimetable.objects.select_related('area', 'horario').all()
        
        # 2. Agrupa por Sala -> Dia
        dados_organizados = {}
        for c in celulas:
            sala = c.area.nome if c.area else "Sem Sala"
            dia = c.dia_semana
            
            if sala not in dados_organizados:
                dados_organizados[sala] = {}
            if dia not in dados_organizados[sala]:
                dados_organizados[sala][dia] = []
                
            dados_organizados[sala][dia].append({
                "id": c.id,
                "horario_inicio": str(c.horario_inicio),
                "horario_fim": str(c.horario_fim),
                "linha_inicial": c.horario.edupage_id if c.horario else None,
                "tamanho_bloco": c.duracao_periodos,
                "turma": c.turma,
                "disciplina": c.disciplina,
                "professor": c.professor,
            })
            
        return Response(dados_organizados, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Sincroniza os horários, salas e aulas com o EduPage.
        Protegido por transaction.atomic() e com tratamento de erro caso o EduPage esteja fora do ar.
        """
        try:
            with transaction.atomic():
                estrutura_service = EstruturaTimetableService()
                tabelas_brutas = estrutura_service.preparar_estrutura()

                celulas_service = CelulasService()
                celulas_salvas = celulas_service.processar_e_salvar_aulas(tabelas_brutas)

            return Response(
                {
                    "mensagem": "Timetable sincronizada com sucesso com o EduPage.",
                    "total_aulas": len(celulas_salvas),
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {
                    "erro": "Não foi possível sincronizar com o EduPage. Verifique a conexão com o serviço.",
                    "detalhes": str(e),
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )
