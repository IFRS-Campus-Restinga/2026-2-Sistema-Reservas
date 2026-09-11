"""
Rotas para o CRUD do Bloco.
"""
from django.urls import path
from api.views.bloco import BlocoListCreateView, BlocoDetailView

"""
ENDPOINTS

GET /api/blocos/ — Retorna a lista completa de blocos cadastrados.
POST /api/blocos/ — Cria um novo bloco no sistema.
GET /api/blocos/<int:pk>/ — Exibe os dados detalhados de um bloco específico pelo ID.
PUT /api/blocos/<int:pk>/ — Atualiza todos os campos de um bloco existente.
PATCH /api/blocos/<int:pk>/ — Atualiza parcialmente apenas os campos enviados de um bloco.
DELETE /api/blocos/<int:pk>/ — Remove permanentemente um bloco do banco de dados.

"""

urlpatterns = [
    path('blocos/', BlocoListCreateView.as_view(), name='bloco-list-create'),
    path('blocos/<int:pk>/', BlocoDetailView.as_view(), name='bloco-detail'),
]