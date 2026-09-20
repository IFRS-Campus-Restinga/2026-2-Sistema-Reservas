from django.contrib import admin
from .models.veiculo_model import Veiculo
from api.models.bloco_model import Bloco
from api.models.area_model import Area
from api.models.grupo_servidor_model import GrupoServidor
from api.models.grupo_aluno_model import GrupoAluno
from api.models.membro_grupo_model import MembroGrupo

"""
Registro de models do app 'api'
"""
admin.site.register(Veiculo)
admin.site.register(Bloco)
admin.site.register(Area)
admin.site.register(GrupoServidor)
admin.site.register(GrupoAluno)
admin.site.register(MembroGrupo)