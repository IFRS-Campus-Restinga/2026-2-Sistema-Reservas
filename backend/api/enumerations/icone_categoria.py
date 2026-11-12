from django.db import models


class IconeCategoria(models.TextChoices):
    """Ícones disponíveis para as categorias (o front mapeia cada valor para um ícone)."""
    INFORMATICA = "INFORMATICA", "Informática"
    AUDIOVISUAL = "AUDIOVISUAL", "Audiovisual"
    MATERIAL_ESPORTIVO = "MATERIAL_ESPORTIVO", "Material esportivo"
    FERRAMENTAS = "FERRAMENTAS", "Ferramentas"
    MATERIAL_APOIO = "MATERIAL_APOIO", "Material de apoio"
    OUTROS = "OUTROS", "Outros"
