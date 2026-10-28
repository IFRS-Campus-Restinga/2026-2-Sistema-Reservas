from django.db import models

from api.enumerations.tipo_recurso_reservavel import TipoRecursoReservavel
from .base_model import BaseModel
from .grupo_model import Grupo
from .tipo_recurso_model import TipoRecurso


class AutorizacaoGrupo(BaseModel):
    grupo = models.ForeignKey(
        Grupo,
        on_delete=models.CASCADE,
        related_name='autorizacoes',
        null=False,
        blank=False,
    )
    tipo_recurso_autorizado = models.CharField(
        max_length=20,
        choices=TipoRecursoReservavel.choices,
        null=False,
        blank=False,
        help_text="Tipo de recurso que o grupo está autorizado a reservar."
    )
    tipo_recurso = models.ForeignKey(
        TipoRecurso,
        on_delete=models.PROTECT,
        related_name='autorizacoes_grupo',
        null=True,
        blank=True,
        help_text="Tipo específico de Recurso Geral autorizado (ex.: bola)."
    )

    def __str__(self):
        if self.tipo_recurso_id:
            return str(self.tipo_recurso)
        return self.get_tipo_recurso_autorizado_display()

    class Meta:
        db_table = 'autorizacao_grupo'
        verbose_name = 'Autorização do grupo'
        verbose_name_plural = 'Autorizações do grupo'
        ordering = ['id']
        constraints = [
            models.UniqueConstraint(
                fields=['grupo', 'tipo_recurso_autorizado', 'tipo_recurso'],
                name='autorizacao_grupo_unica',
            ),
        ]
