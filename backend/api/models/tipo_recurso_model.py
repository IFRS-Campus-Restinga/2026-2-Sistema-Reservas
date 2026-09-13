from django.db import models
from .base_model import BaseModel


class TipoRecurso(BaseModel):
    descricao = models.CharField(max_length=50)

    def __str__(self):
        return self.descricao