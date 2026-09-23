from django.db import models
from .base_model import BaseModel
from api.enumerations.categoria_recurso import CategoriaRecurso


class TipoRecurso(BaseModel):
    descricao = models.CharField(max_length=50)
    categoria = models.CharField(
        max_length=20,
        choices=CategoriaRecurso.choices,
        default=CategoriaRecurso.OUTROS,
    )

    def __str__(self):
        return self.descricao