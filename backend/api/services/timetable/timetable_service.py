from datetime import time
from .edupage_service import EdupageService
from api.models import Area, Bloco
from api.models.timetable import HorarioTimetable

class EstruturaTimetableService:
    
    def __init__(self):
        self.api_service = EdupageService()

    def criar_horarios(self):
        """
        Verifica se a tabela HorarioTimetable está vazia.
        Se estiver, insere os 15 horários padrão do IFRS.
        """
        if HorarioTimetable.objects.exists():
            return  # Já existem horários, não faz nada
            
        # Lista com o De-Para de (edupage_id, hora_inicio, hora_fim)
        grade_padrao = [
            # MANHÃ
            (1, time(7, 30), time(8, 20)),
            (2, time(8, 20), time(9, 10)),
            (3, time(9, 10), time(10, 00)),
            (4, time(10, 20), time(11, 10)),
            (5, time(11, 10), time(12, 00)),
            # TARDE
            (6, time(13, 30), time(14, 20)),
            (7, time(14, 20), time(15, 10)),
            (8, time(15, 10), time(16, 00)),
            (9, time(16, 20), time(17, 10)),
            (10, time(17, 10), time(18, 00)),
            # NOITE
            (11, time(18, 10), time(19, 00)),
            (12, time(19, 00), time(19, 50)),
            (13, time(19, 50), time(20, 40)),
            (14, time(20, 50), time(21, 40)),
            (15, time(21, 40), time(22, 30)),
        ]

        horarios_para_salvar = []
        for edupage_id, inicio, fim in grade_padrao:
            horarios_para_salvar.append(
                HorarioTimetable(
                    edupage_id=edupage_id, 
                    horario_inicio=inicio, 
                    horario_fim=fim
                )
            )
            
        # bulk_create salva a lista toda de uma vez no banco (mais rápido)
        HorarioTimetable.objects.bulk_create(horarios_para_salvar)

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

            # Tenta encontrar a área no banco cujo nome contenha "516",
            # se não for encontrada, os blocos serão criados automaticamente

            area = Area.objects.filter(nome__icontains=sala_numero).first()

            if area:
                # se a sala já existe no banco, apenas vincula o ID
                area.edupage_id = sala_id
                area.save()
            else:
                """
                Se a sala não existir no banco (o que irá ocorrer em sua primeira execução),
                 devemos criá-la automaticamente e também seus blocos. Pela lógica da estrutura
                 com IF - Restinga, os números das salas sempre começam com o número do bloco.
                 OBS: a sala 701 se encontra no bloco 5, portanto criamos uma exceção no algoritmo
                 para este caso
                """
                primeiro_digito = sala_numero[0] if sala_numero[0].isdigit() else "1"
                numero_bloco = "5" if sala_numero == "701" else primeiro_digito 

                # Captura do bloco (caso já exista) ou criação (em caso de primeira execução)
                bloco, _ = Bloco.objects.get_or_create(
                    numero=numero_bloco,
                    defaults={'nome': f"Bloco {numero_bloco}"}
                )
                
                # Cria a área com os valores default automáticos
                Area.objects.create(
                    nome=sala_numero,
                    bloco=bloco,
                    edupage_id=sala_id
                )

    def preparar_estrutura(self):
            """
            Orquestra a preparação do banco de dados (Task 2).
            """
            self.criar_horarios()
            
            tabelas = self.api_service.obter_tabelas_brutas()
            dados_salas = next((t["data_rows"] for t in tabelas if t["id"] == "classsalas"), [])
            
            self.sincronizar_salas(dados_salas)
            
            # O método retorna as tabelas originais para que a Task 3 possa usá-las depois
            return tabelas