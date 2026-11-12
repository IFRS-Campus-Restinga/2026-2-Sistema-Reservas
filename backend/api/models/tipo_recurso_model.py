from django.db import models
from .base_model import BaseModel
from .categoria_recurso_model import CategoriaRecurso


class TipoRecurso(BaseModel):
    descricao = models.CharField(max_length=50)
    categoria = models.ForeignKey(
        CategoriaRecurso,
        on_delete=models.PROTECT,
        related_name='tipos',
        null=True,
        blank=True,
    )

    def __str__(self):
        return self.descricao