from datetime import time
from .edupage_service import EdupageService
from api.models import Area, Bloco
from api.models.timetable import HorarioTimetable

class EstruturaTimetableService:
    
    def __init__(self):
        self.api_service = EdupageService()

    def criar_horarios(self, dados_periods=None):
        """
        Sincroniza os horários da tabela HorarioTimetable com os períodos do EduPage (IDs 1 a 16).
        Se vier dados_periods do JSON, utiliza diretamente.
        Caso contrário, utiliza a grade padrão de 16 períodos com fallback.
        """
        if dados_periods:
            for p in dados_periods:
                try:
                    p_id = int(p.get("id"))
                    start_str = p.get("starttime")
                    end_str = p.get("endtime")
                    if start_str and end_str:
                        h_ini, m_ini = map(int, start_str.split(":"))
                        h_fim, m_fim = map(int, end_str.split(":"))
                        HorarioTimetable.objects.update_or_create(
                            edupage_id=p_id,
                            defaults={
                                'horario_inicio': time(h_ini, m_ini),
                                'horario_fim': time(h_fim, m_fim),
                            }
                        )
                except Exception:
                    continue
            return

        # Grade padrão com os 16 períodos reais do EduPage (incluindo o Entre Turnos no ID 6)
        grade_padrao = [
            # MANHÃ
            (1, time(7, 30), time(8, 20)),
            (2, time(8, 20), time(9, 10)),
            (3, time(9, 10), time(10, 0)),
            (4, time(10, 20), time(11, 10)),
            (5, time(11, 10), time(12, 0)),
            # ENTRE TURNOS
            (6, time(12, 0), time(13, 30)),
            # TARDE
            (7, time(13, 30), time(14, 20)),
            (8, time(14, 20), time(15, 10)),
            (9, time(15, 10), time(16, 0)),
            (10, time(16, 20), time(17, 10)),
            (11, time(17, 10), time(18, 0)),
            # NOITE
            (12, time(18, 10), time(19, 0)),
            (13, time(19, 0), time(19, 50)),
            (14, time(19, 50), time(20, 40)),
            (15, time(20, 50), time(21, 40)),
            (16, time(21, 40), time(22, 30)),
        ]

        for edupage_id, inicio, fim in grade_padrao:
            HorarioTimetable.objects.update_or_create(
                edupage_id=edupage_id,
                defaults={'horario_inicio': inicio, 'horario_fim': fim}
            )

    def sincronizar_salas(self, dados_salas):
        """
        Lê a lista de salas do JSON e garante que todas existam no banco de dados.
        Atualiza o campo edupage_id com o ID vindo da API.
        Cria os blocos que ainda não existem no banco baseando-se no primeiro dígito do número das salas (Padrão IF)
        """
        for sala in dados_salas:
            sala_id = sala.get("id")         # Ex: "-61"
            sala_numero = sala.get("short")    # Ex: "516"
            
            if not sala_numero:
                continue
                
            sala_numero = sala_numero.strip()

            # Tenta encontrar a área no banco cujo nome contenha "516",
            # se não for encontrada, os blocos serão criados automaticamente

            area = Area.objects.filter(nome__icontains=sala_numero).first()

            if area:
                # se a sala já existe no banco, apenas vincula o ID
                area.edupage_id = sala_id
                area.save()
            else:
                primeiro_digito = sala_numero[0] if sala_numero[0].isdigit() else "1"
                numero_bloco = "5" if sala_numero == "701" else primeiro_digito 

                bloco, _ = Bloco.objects.get_or_create(
                    numero=numero_bloco,
                    defaults={'nome': f"Bloco {numero_bloco}"}
                )
                
                area_obj, created = Area.objects.get_or_create(
                    nome=sala_numero,
                    bloco=bloco,
                    defaults={'edupage_id': sala_id}
                )
                if not created:
                    area_obj.edupage_id = sala_id
                    area_obj.save()

    def preparar_estrutura(self):
        """
        Orquestra a preparação do banco de dados (Task 2).
        """
        tabelas = self.api_service.obter_tabelas_brutas()
        dados_periods = next((t["data_rows"] for t in tabelas if t["id"] == "periods"), [])
        dados_salas = next((t["data_rows"] for t in tabelas if t["id"] == "classrooms"), [])
        
        self.criar_horarios(dados_periods)
        self.sincronizar_salas(dados_salas)
        
        # O método retorna as tabelas originais para que a Task 3 possa usá-las depois
        return tabelas