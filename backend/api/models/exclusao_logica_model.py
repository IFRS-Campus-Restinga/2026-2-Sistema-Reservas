from django.db import models

from api.managers import AtivosManager, ExclusaoLogicaQuerySet
from .base_model import BaseModel


class ExclusaoLogicaModel(BaseModel):
    excluido_em = models.DateTimeField(
        null=True,
        blank=True,
        editable=False,
        help_text="Data e hora da exclusão lógica. Vazio enquanto o registro está ativo."
    )

    relacoes_exclusao_em_cascata = ()

    objects = AtivosManager()
    todos = ExclusaoLogicaQuerySet.as_manager()

    def delete(self, using=None, keep_parents=False):
        resultado = type(self).objects.filter(pk=self.pk).delete()
        self.excluido_em = type(self).todos.values_list('excluido_em', flat=True).get(pk=self.pk)
        return resultado

    class Meta(BaseModel.Meta):
        abstract = True
