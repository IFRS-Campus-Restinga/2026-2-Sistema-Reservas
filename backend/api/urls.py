from django.urls import path
from api.views.recurso_geral_view import *
from api.views.tipo_recurso_view import TipoRecursoCreateView

urlpatterns = [
    path('recursos-gerais/', RecursoGeralListCreateView.as_view()),
     path('recursos-gerais/<int:pk>/', RecursoGeralDetailView.as_view()),
    path('tipos-recurso/', TipoRecursoCreateView.as_view()),
]