from django.db import models

from api.enumerations.icone_categoria import IconeCategoria
from .base_model import BaseModel


class CategoriaRecurso(BaseModel):
    nome = models.CharField(max_length=50, unique=True)
    icone = models.CharField(
        max_length=30,
        choices=IconeCategoria.choices,
        default=IconeCategoria.OUTROS,
        help_text="Ícone exibido no catálogo de recursos.",
    )

    class Meta:
        db_table = 'categoria_recurso'
        verbose_name = 'Categoria de recurso'
        verbose_name_plural = 'Categorias de recurso'
        ordering = ['nome']

    def __str__(self):
        return self.nome
