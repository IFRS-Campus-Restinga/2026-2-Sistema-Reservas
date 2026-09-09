from django.urls import path

from hub_integrations.views import sessao_token

urlpatterns = [
    path('session/token/', sessao_token),
]
