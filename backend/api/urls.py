from django.urls import path
from api.views.recurso_geral_view import RecursoGeralCreateView
from api.views.tipo_recurso_view import TipoRecursoCreateView

urlpatterns = [
    path('recursos-gerais/', RecursoGeralCreateView.as_view()),
    path('tipos-recurso/', TipoRecursoCreateView.as_view()),
]