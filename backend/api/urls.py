from django.urls import path
from api.views.minhas_reservas_view import MinhasReservasListView, ResumoReservasView
from api.views.recurso_geral_view import RecursoGeralListCreateView, RecursoGeralDetailView
from api.views.tipo_recurso_view import TipoRecursoCreateView
from api.views.bloco_view import BlocoListCreateView, BlocoDetailView
from api.views.area_view import AreaDetailView, AreaListCreateView
from api.views.grupo_view import GrupoListCreateView, GrupoDetailView
from api.views.membro_grupo_view import MembroGrupoListCreateView, MembroGrupoCandidatosView, MembroGrupoDetailView
from api.views.veiculo_view import VeiculoCreateView, VeiculoDetailView
from api.views.timetable_view import TimetableView
from api.views.log_auditoria_view import LogAuditoriaListView, LogAuditoriaDetailView
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
from api.views.recorrencia_view import RecorrenciaReservaAreaDetailView
from api.views.agenda_reserva_view import AgendaReservasView
from api.views.reserva_pendente_view import ReservasPendentesListView, ConfirmarReservaView, CancelarReservaAdminView
from api.views.notificacao_view import MinhasNotificacoesListView, MarcarNotificacaoLidaView
from api.views.data_atual_view import DataAtualView
from api.views.termo_view import (
    TermoReservaView, ModeloTermoView, ArquivoTermoView, AnaliseTermoView,
    SolicitacoesTermoView, TermoOperacionalView, ModeloTermoOperacionalView,
    AnaliseTermoOperacionalView,
)


urlpatterns = [
    path('reservas/resumo/', ResumoReservasView.as_view(), name='resumo-reservas'),
    path('reservas/minhas/', MinhasReservasListView.as_view(), name='minhas-reservas'),
    path('reservas/<int:pk>/termo/', TermoReservaView.as_view(), name='termo-reserva'),
    path('reservas/<int:pk>/termo/modelo/', ModeloTermoView.as_view(), name='termo-modelo'),
    path('reservas/<int:pk>/termo/analise/', AnaliseTermoView.as_view(), name='termo-analise'),
    path('reservas/<int:pk>/termo-operacional/<str:tipo>/', TermoOperacionalView.as_view(), name='termo-operacional'),
    path('reservas/<int:pk>/termo-operacional/<str:tipo>/modelo/', ModeloTermoOperacionalView.as_view(), name='termo-operacional-modelo'),
    path('reservas/<int:pk>/termo-operacional/<str:tipo>/analise/', AnaliseTermoOperacionalView.as_view(), name='termo-operacional-analise'),
    path('termos/<int:pk>/arquivo/', ArquivoTermoView.as_view(), name='termo-arquivo'),
    path('termos/<int:pk>/modelo/', ArquivoTermoView.as_view(original=True), name='termo-modelo-enviado'),
    path('solicitacoes/termos/', SolicitacoesTermoView.as_view(), name='solicitacoes-termos'),
    path('recursos-gerais/', RecursoGeralListCreateView.as_view(), name='recurso-geral-list-create'),
    path('recursos-gerais/<int:pk>/', RecursoGeralDetailView.as_view(), name='recurso-geral-detail'),
    path('tipos-recurso/', TipoRecursoCreateView.as_view(), name='tipo-recurso-create'),
    path('blocos/', BlocoListCreateView.as_view(), name='bloco-list-create'),
    path('blocos/<int:pk>/', BlocoDetailView.as_view(), name='bloco-detail'),
    path('areas/', AreaListCreateView.as_view(), name='area-list-create'),
    path('areas/<int:pk>/', AreaDetailView.as_view(), name='area-detail'),
    path("veiculos/", VeiculoCreateView.as_view(), name="veiculo-list"),
    path("veiculos/<int:pk>/", VeiculoDetailView.as_view(), name="veiculo-detail"),
    path('timetable/', TimetableView.as_view(), name='timetable-list'),
    path('auditoria/', LogAuditoriaListView.as_view(), name='log-auditoria-list'),
    path('auditoria/<int:pk>/', LogAuditoriaDetailView.as_view(), name='log-auditoria-detail'),
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
    path("reservas/areas/recorrencias/<int:pk>/", RecorrenciaReservaAreaDetailView.as_view(), name="reserva-area-recorrencia-detail"),
    path("reservas/areas/<int:pk>/", ReservaAreaDetailView.as_view(), name="reserva-area-detail"),
    path("reservas/veiculos/", ReservaVeiculoListCreateView.as_view(), name="reserva-veiculo-list-create"),
    path("reservas/veiculos/disponibilidade/", DisponibilidadeReservaVeiculoView.as_view(), name="disponibilidade-reserva-veiculo"),
    path("reservas/pendentes/", ReservasPendentesListView.as_view(), name="reservas-pendentes"),
    path("reservas/pendentes/<int:pk>/confirmar/", ConfirmarReservaView.as_view(), name="reserva-pendente-confirmar"),
    path("notificacoes/", MinhasNotificacoesListView.as_view(), name="minhas-notificacoes"),
    path("notificacoes/<int:pk>/lida/", MarcarNotificacaoLidaView.as_view(), name="notificacao-marcar-lida"), 
    path("reservas/<int:pk>/cancelar/", CancelarReservaAdminView.as_view(), name="reserva-admin-cancelar"),   
    path("data-atual/", DataAtualView.as_view(), name="data-atual"),
    path("reservas/agenda/", AgendaReservasView.as_view(), name="agenda-reservas"),
    path("reservas/veiculos/<int:pk>/", ReservaVeiculoDetailView.as_view(), name="reserva-veiculo-detail"),
]
