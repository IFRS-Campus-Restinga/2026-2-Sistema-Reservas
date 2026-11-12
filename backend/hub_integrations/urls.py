from django.urls import path

from hub_integrations.views import entrar_demonstracao, quem_sou_eu, sessao_token, usuarios_demonstracao

urlpatterns = [
    path('token/', sessao_token),
    path('me/', quem_sou_eu),
    path('demonstracao/', usuarios_demonstracao),
    path('demonstracao/<str:perfil>/', entrar_demonstracao),
]
