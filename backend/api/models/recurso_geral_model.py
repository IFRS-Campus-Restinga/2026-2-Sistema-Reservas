from django.db import models
from django.core.validators import MinLengthValidator, MinValueValidator
from .base_model import BaseModel
from .tipo_recurso_model import TipoRecurso
from api.enumerations.tipo_prazo import TipoPrazo
from api.enumerations.status_recurso import StatusRecurso


class RecursoGeral(BaseModel):
    nome = models.CharField(max_length=50, validators=[MinLengthValidator(3)])
    tipo_recurso = models.ForeignKey(
        TipoRecurso,
        on_delete=models.PROTECT,
        related_name="recursos"
    )
    codigo = models.CharField(max_length=50, blank=True, null=True)
    tipo_prazo = models.CharField(max_length=20, choices=TipoPrazo.choices)
    quantidade_total = models.IntegerField(validators=[MinValueValidator(0)])
    quantidade_reservada = models.IntegerField(validators=[MinValueValidator(0)], default=0)
    tem_termo_de_responsabilidade = models.BooleanField(default=False)
    observacao = models.TextField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=StatusRecurso.choices)

    def __str__(self):
        return self.nome
