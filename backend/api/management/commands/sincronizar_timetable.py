from django.core.management.base import BaseCommand
from api.services.timetable.estrutura_timetable_service import EstruturaTimetableService
from api.services.timetable.celulas_service import CelulasService

class Command(BaseCommand):
    help = "Sincroniza os dados da grade horária do Edupage com o banco de dados do Sistema de Reservas."

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Iniciando a sincronização da Timetable com o Edupage..."))
        
        try:
            # Etapa 1: Estrutura (Horários e Salas)
            self.stdout.write("Preparando estrutura base de horários e salas...")
            estrutura_service = EstruturaTimetableService()
            tabelas_brutas = estrutura_service.preparar_estrutura()
            self.stdout.write(self.style.SUCCESS("Estrutura base sincronizada com sucesso!"))
            
            # Etapa 2: Aulas (Células)
            self.stdout.write("Processando e desnormalizando células de aulas...")
            celulas_service = CelulasService()
            celulas_salvas = celulas_service.processar_e_salvar_aulas(tabelas_brutas)
            quantidade_salvas = len(celulas_salvas)
            self.stdout.write(self.style.SUCCESS(f"Sincronização concluída com sucesso! {quantidade_salvas} aulas salvas para o semestre ativo."))
            
            if quantidade_salvas > 0:
                primeiro = celulas_salvas[0]
                ultimo = celulas_salvas[-1]
                
                self.stdout.write("\n=== Primeiro Registro Salvo ===")
                self.stdout.write(f"Sala: {primeiro.area.nome}")
                self.stdout.write(f"Dia: {primeiro.dia_semana}")
                self.stdout.write(f"Horário: {primeiro.horario_inicio} às {primeiro.horario_fim}")
                self.stdout.write(f"Aula: {primeiro.disciplina} | Turma: {primeiro.turma} | Prof: {primeiro.professor}")
                
                self.stdout.write("\n=== Último Registro Salvo ===")
                self.stdout.write(f"Sala: {ultimo.area.nome}")
                self.stdout.write(f"Dia: {ultimo.dia_semana}")
                self.stdout.write(f"Horário: {ultimo.horario_inicio} às {ultimo.horario_fim}")
                self.stdout.write(f"Aula: {ultimo.disciplina} | Turma: {ultimo.turma} | Prof: {ultimo.professor}\n")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Erro durante a sincronização da timetable: {str(e)}"))
