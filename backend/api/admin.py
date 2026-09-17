from django.contrib import admin
from .models.veiculo_model import Veiculo
from api.models.bloco_model import Bloco
from api.models.area_model import Area

"""
Registro de models do app 'api'
"""
admin.site.register(Veiculo)
admin.site.register(Bloco)
admin.site.register(Area)