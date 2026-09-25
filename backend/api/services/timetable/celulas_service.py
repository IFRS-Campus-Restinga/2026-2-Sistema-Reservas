from datetime import date
from django.utils import timezone
from django.db import transaction
from api.models import Area
from api.models.timetable import HorarioTimetable, PeriodoLetivo, CelulaTimetable
from api.enumerations.timetable_enumerations.dia_semana_enum import DiaSemana

class CelulasService:
    """
    Serviço responsável por ler os dados crus (desnormalizados) do EduPage,
    cruzar os IDs e convertê-los em instâncias reais de CelulaTimetable no banco.
    """

    def obter_semestre_atual(self):
        """
        Calcula o semestre letivo atual com base na data do servidor (ex: 2026/2).
        Garante que ele seja marcado como ativo.
        """
        hoje = date.today()
        semestre_numero = 1 if hoje.month <= 6 else 2
        nome_semestre = f"{hoje.year}/{semestre_numero}"

        # Busca ou cria o periodo letivo
        periodo, _ = PeriodoLetivo.objects.get_or_create(
            nome=nome_semestre,
            defaults={
                'data_inicio': date(hoje.year, 1, 1) if semestre_numero == 1 else date(hoje.year, 7, 1),
                'data_fim': date(hoje.year, 6, 30) if semestre_numero == 1 else date(hoje.year, 12, 31),
                'ativo': True,
                'ultima_sincronizacao': timezone.now()
            }
        )
        
        # Se ele já existia, atualizamos a data da sincronização e re-ativamos
        if not _:
            periodo.ultima_sincronizacao = timezone.now()
            periodo.ativo = True
            periodo.save()
            
        return periodo

    def traduzir_dias(self, days):
        """
        Converte a bit do EduPage que representa o dia da semana (ex: '00100 = quarta-feira') para a constante TextChoices (Quarta-feira)
        """
        if not days or len(days) < 5:
            return None
            
        # O padrão do EduPage da esquerda pra direita: Seg, Ter, Qua, Qui, Sex
        mapa_dias = {
            0: DiaSemana.SEGUNDA.value,
            1: DiaSemana.TERCA.value,
            2: DiaSemana.QUARTA.value,
            3: DiaSemana.QUINTA.value,
            4: DiaSemana.SEXTA.value
        }
        
        for index, char in enumerate(days[:5]):
            if char == '1':
                return mapa_dias.get(index)
        return None

    def encontrar_tabela(self, tabelas, nome):

        # atalho para buscar os data_rows de uma tabela específica dentro do JSON bruto
        return next((t["data_rows"] for t in tabelas if t["id"] == nome), [])

    # Decorador de método de segurança para garantir a integridade dos dados.
    # O Django envelopa a função e só entrega seu retorno quando ela terminar.
    @transaction.atomic 
    def processar_e_salvar_aulas(self, tabelas):
        """
        Recebe o JSON completo do EduPage e desnormaliza as aulas (cards + lessons)
        criando instâncias físicas na tabela CelulaTimetable.
        Envolto em transaction.atomic para garantir que ou salva tudo, ou não salva nada em caso de erro.
        """
        semestre_ativo = self._obter_semestre_atual()
        
        # 1. Extração dos dicionários do JSON
        dados_cards = self.encontrar_tabela(tabelas, "cards")
        dados_lessons = self.encontrar_tabela(tabelas, "lessons")
        dados_subjects = self.encontrar_tabela(tabelas, "subjects")
        dados_teachers = self.encontrar_tabela(tabelas, "teachers")
        dados_classes = self.encontrar_tabela(tabelas, "classes")
        
        # Criação de índices (dicionários rápidos) para buscar por ID sem precisar rodar `for` toda hora
        idx_lessons = { l["id"]: l for l in dados_lessons }
        idx_subjects = { s["id"]: s.get("name", "") for s in dados_subjects }
        idx_teachers = { t["id"]: t.get("name", "") for t in dados_teachers }
        idx_classes = { c["id"]: c.get("name", "") for c in dados_classes }
        
        # Limpa as células antigas DESSA SINCROMIZAÇÃO para não duplicar aulas toda vez que rodarmos o script
        # Por isso utilizo o decorador assinado na função
        CelulaTimetable.objects.filter(periodo_letivo=semestre_ativo).delete()
        
        celulas_para_salvar = []
        
        # 2. Iterar sobre todos os cartões (os bloquinhos reais do horário)
        for card in dados_cards:
            lesson_id = card.get("lessonid")
            lesson = idx_lessons.get(lesson_id)
            
            if not lesson:
                continue
                
            # Extração de IDs dos relacionamentos
            subject_id = lesson.get("subjectid")
            teacher_ids = lesson.get("teacherids", [])
            class_ids = lesson.get("classids", [])
            classroom_ids = card.get("classroomids", [])
            period_id = card.get("period")
            days = card.get("days")
            duracao = lesson.get("durationperiods", 1)
            
            if not classroom_ids or not period_id:
                continue
                
            sala_edupage_id = classroom_ids[0]
            
            # Resolução dos nomes em texto
            disciplina = idx_subjects.get(subject_id, "Desconhecida")
            
            # Pode ter mais de um professor ou turma na mesma aula, então juntamos com vírgula
            professor = ", ".join(filter(None, [idx_teachers.get(t_id) for t_id in teacher_ids]))
            turma = ", ".join(filter(None, [idx_classes.get(c_id) for c_id in class_ids]))
            
            dia_traduzido = self._traduzir_dias(days)
            if not dia_traduzido:
                continue
                
            # Buscar no banco as instâncias reais vinculadas
            area_banco = Area.objects.filter(edupage_id=sala_edupage_id).first()
            horario_banco = HorarioTimetable.objects.filter(edupage_id=int(period_id)).first()
            
            # Se a sala ou horário não estiverem no nosso banco, ignoramos a criação dessa célula
            if not area_banco or not horario_banco:
                continue
                
            celulas_para_salvar.append(
                CelulaTimetable(
                    area=area_banco,
                    periodo_letivo=semestre_ativo,
                    horario=horario_banco,
                    disciplina=disciplina[:150],  # [:150] garante que não ultrapassará o max_length do model
                    professor=professor[:150],
                    turma=turma[:100],
                    dia_semana=dia_traduzido,
                    duracao_periodos=duracao,
                    edupage_card_id=card.get("id")
                )
            )
            
        # 3. Salva tudo de uma vez de forma performática no banco de dados
        if celulas_para_salvar:
            CelulaTimetable.objects.bulk_create(celulas_para_salvar)
            
        return len(celulas_para_salvar)
