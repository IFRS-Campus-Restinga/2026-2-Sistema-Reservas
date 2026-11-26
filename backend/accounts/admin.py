from django.contrib import admin
from .models import AdministradorAutorizado, HubUser

admin.site.register(HubUser)
admin.site.register(AdministradorAutorizado)
