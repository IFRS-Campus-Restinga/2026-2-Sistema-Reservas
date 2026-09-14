from django.urls import path

from api.views.veiculo_view import VeiculoCreateView, VeiculoDetailView

urlpatterns = [
    path("veiculos/", VeiculoCreateView.as_view(), name="veiculo-list"),
    path("veiculos/<int:pk>/", VeiculoDetailView.as_view(), name="veiculo-detail"),
]
