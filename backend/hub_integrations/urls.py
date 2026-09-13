from django.urls import path

from hub_integrations.views import sessao_token, quem_sou_eu

urlpatterns = [
    path('token/', sessao_token),
    path('me/', quem_sou_eu),
]
