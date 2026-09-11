from django.urls import path

from hub_integrations.views import sessao_token

urlpatterns = [
    path('token/', sessao_token),
]
