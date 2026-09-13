from django.urls import path
from api.views.recurso_geral_view import RecursoGeralListCreateView, RecursoGeralDetailView
from api.views.tipo_recurso_view import TipoRecursoCreateView


urlpatterns = [
    path('recursos-gerais/', RecursoGeralListCreateView.as_view(), name='recurso-geral-list-create'),
    path('recursos-gerais/<int:pk>/', RecursoGeralDetailView.as_view(), name='recurso-geral-detail'),
    path('tipos-recurso/', TipoRecursoCreateView.as_view(), name='tipo-recurso-create'),
]
