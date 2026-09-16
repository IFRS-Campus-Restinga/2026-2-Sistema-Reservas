from django.contrib import admin
from .models.veiculo_model import Veiculo
from api.models.bloco_model import Bloco

"""
Registro de models do app 'api'
"""
admin.site.register(Veiculo)

admin.site.register(Bloco)