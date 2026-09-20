from .grupo_model import Grupo


class GrupoAluno(Grupo):
  class Meta:
        db_table = 'grupo_aluno'
        verbose_name = 'Grupo de Alunos'
        verbose_name_plural = 'Grupos de Alunos'
