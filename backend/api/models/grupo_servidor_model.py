from .grupo_model import Grupo


class GrupoServidor(Grupo):
    class Meta:
        db_table = 'grupo_servidor'
        verbose_name = 'Grupo de Servidores'
        verbose_name_plural = 'Grupos de Servidores'
