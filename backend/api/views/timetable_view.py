from rest_framework.views import APIView
from rest_framework.response import Response
from api.models.timetable.celula_timetable_model import CelulaTimetable
from api.services.timetable.estrutura_timetable_service import EstruturaTimetableService
from api.services.timetable.celulas_service import CelulasService

class TimetableView(APIView):
    """
    Retorna a grade horária completa agrupada por Salas e Dias da Semana.
    Implementa Lazy Loading: Se o banco estiver vazio, aciona a sincronização com Edupage primeiro.
    """
    
    def get(self, request):
        # 1. Verifica se existem células cadastradas
        if not CelulaTimetable.objects.exists():
            # Lazy Loading: Aciona o scraping e popula o banco
            estrutura_service = EstruturaTimetableService()
            tabelas_brutas = estrutura_service.preparar_estrutura()
            
            celulas_service = CelulasService()
            celulas_service.processar_e_salvar_aulas(tabelas_brutas)
            
        # 2. Busca todas as células do banco
        celulas = CelulaTimetable.objects.select_related('area', 'horario').all()
        
        # 3. Agrupa por Sala -> Dia
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
                "linha_inicial": c.horario.edupage_id if c.horario else None, # Útil para renderizar a matriz no front
                "tamanho_bloco": c.duracao_periodos,
                "turma": c.turma,
                "disciplina": c.disciplina,
                "professor": c.professor,
            })
            
        return Response(dados_organizados)
