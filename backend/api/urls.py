from django.urls import path
from api.views.recurso_geral_view import RecursoGeralListCreateView, RecursoGeralDetailView
from api.views.tipo_recurso_view import TipoRecursoCreateView
from api.views.bloco_view import BlocoListCreateView, BlocoDetailView
from api.views.area_view import AreaDetailView, AreaListCreateView
from api.views.grupo_view import GrupoListCreateView, GrupoDetailView
from api.views.membro_grupo_view import MembroGrupoListCreateView, MembroGrupoCandidatosView, MembroGrupoDetailView
from api.views.veiculo_view import VeiculoCreateView, VeiculoDetailView
from api.views.reserva_recurso_geral_view import ReservaRecursoGeralListCreateView, ReservaRecursoGeralDetailView, DisponibilidadeRecursoGeralView
from api.views.reserva_area_view import (
    ReservaAreaListCreateView,
    MinhasReservasAreaListView,
    ReservaAreaDetailView,
)
from api.views.reserva_veiculo_view import (
    DisponibilidadeReservaVeiculoView,
    ReservaVeiculoDetailView,
    ReservaVeiculoListCreateView,
)
from api.views.agenda_reserva_view import AgendaReservasView


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
    path('grupos/', GrupoListCreateView.as_view(), name='grupo-list-create'),
    path('grupos/<int:pk>/', GrupoDetailView.as_view(), name='grupo-detail'),
    path('grupos/<int:grupo_pk>/membros/', MembroGrupoListCreateView.as_view(), name='membro-grupo-list-create'),
    path('grupos/<int:grupo_pk>/candidatos/', MembroGrupoCandidatosView.as_view(), name='membro-grupo-candidatos'),
    path('grupos/<int:grupo_pk>/membros/<int:pk>/', MembroGrupoDetailView.as_view(), name='membro-grupo-detail'),
    path("reservas/recursos-gerais/", ReservaRecursoGeralListCreateView.as_view(), name="reserva-recurso-geral-list-create"),
    path("reservas/recursos-gerais/disponibilidade/", DisponibilidadeRecursoGeralView.as_view(), name="disponibilidade-recurso-geral"),
    path("reservas/recursos-gerais/<int:pk>/", ReservaRecursoGeralDetailView.as_view(), name="reserva-recurso-geral-detail"),
    path("reservas/areas/", ReservaAreaListCreateView.as_view(), name="reserva-area-list-create"),
    path("reservas/areas/minhas/", MinhasReservasAreaListView.as_view(), name="reserva-area-minhas"),
    path("reservas/areas/<int:pk>/", ReservaAreaDetailView.as_view(), name="reserva-area-detail"),
    path("reservas/veiculos/", ReservaVeiculoListCreateView.as_view(), name="reserva-veiculo-list-create"),
    path("reservas/veiculos/disponibilidade/", DisponibilidadeReservaVeiculoView.as_view(), name="disponibilidade-reserva-veiculo"),
    path("reservas/agenda/", AgendaReservasView.as_view(), name="agenda-reservas"),
    path("reservas/veiculos/<int:pk>/", ReservaVeiculoDetailView.as_view(), name="reserva-veiculo-detail"),
]
