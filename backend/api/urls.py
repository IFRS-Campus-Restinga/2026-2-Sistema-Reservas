"""
Rotas para o CRUD do Bloco.
"""
from django.urls import path
from api.views.bloco_view import BlocoListCreateView, BlocoDetailView
from api.views.area_view import AreaDetailView, AreaListCreateView


"""
ENDPOINTS DE BLOCO:
GET /api/blocos/ — Retorna a lista completa de blocos cadastrados.
POST /api/blocos/ — Cria um novo bloco no sistema.
GET /api/blocos/<int:pk>/ — Exibe os dados detalhados de um bloco específico pelo ID.
PUT /api/blocos/<int:pk>/ — Atualiza todos os campos de um bloco existente.
PATCH /api/blocos/<int:pk>/ — Atualiza parcialmente apenas os campos enviados de um bloco.
DELETE /api/blocos/<int:pk>/ — Remove permanentemente um bloco do banco de dados.

ENDPOINTS DE ÁREA:
GET /api/areas/ — Retorna a lista completa de áreas cadastradas.
POST /api/areas/ — Cria uma nova área no sistema.
GET /api/areas/<int:pk>/ — Exibe os dados detalhados de uma área específica pelo ID.
PUT /api/areas/<int:pk>/ — Atualiza todos os campos de uma área existente.
PATCH /api/areas/<int:pk>/ — Atualiza parcialmente apenas os campos enviados de uma área.
DELETE /api/areas/<int:pk>/ — Remove permanentemente uma área do banco de dados.
"""

urlpatterns = [
    # Rotas de Bloco
    path('blocos/', BlocoListCreateView.as_view(), name='bloco-list-create'),
    path('blocos/<int:pk>/', BlocoDetailView.as_view(), name='bloco-detail'),

    # Rotas de Área
    path('areas/', AreaListCreateView.as_view(), name='area-list-create'),
    path('areas/<int:pk>/', AreaDetailView.as_view(), name='area-detail'),
]