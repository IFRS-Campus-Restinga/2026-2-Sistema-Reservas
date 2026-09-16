from django.urls import path
from api.views.recurso_geral_view import RecursoGeralListCreateView, RecursoGeralDetailView
from api.views.tipo_recurso_view import TipoRecursoCreateView
from api.views.bloco_view import BlocoListCreateView, BlocoDetailView
from api.views.area_view import AreaDetailView, AreaListCreateView

from api.views.veiculo_view import VeiculoCreateView, VeiculoDetailView

urlpatterns = [
    path('recursos-gerais/', RecursoGeralListCreateView.as_view(), name='recurso-geral-list-create'),
    path('recursos-gerais/<int:pk>/', RecursoGeralDetailView.as_view(), name='recurso-geral-detail'),
    path('tipos-recurso/', TipoRecursoCreateView.as_view(), name='tipo-recurso-create'),
    path('blocos/', BlocoListCreateView.as_view(), name='bloco-list-create'),
    path('blocos/<int:pk>/', BlocoDetailView.as_view(), name='bloco-detail'),
    path('areas/', AreaListCreateView.as_view(), name='area-list-create'),
    path('areas/<int:pk>/', AreaDetailView.as_view(), name='area-detail'),
    path("veiculos/", VeiculoCreateView.as_view(), name="veiculo-list"),
    path("veiculos/<int:pk>/", VeiculoDetailView.as_view(), name="veiculo-detail"),
]
