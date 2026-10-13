from django.db import models, transaction
from django.utils import timezone


class ExclusaoLogicaQuerySet(models.QuerySet):
    def delete(self):
        agora = timezone.now()
        with transaction.atomic():
            for nome_relacao in self.model.relacoes_exclusao_em_cascata:
                relacao = self.model._meta.get_field(nome_relacao)
                relacao.related_model.objects.filter(**{f'{relacao.field.name}__in': self}).update(excluido_em=agora)
            quantidade = self.update(excluido_em=agora)
        return quantidade, {self.model._meta.label: quantidade}


class AtivosManager(models.Manager.from_queryset(ExclusaoLogicaQuerySet)):
    def get_queryset(self):
        return super().get_queryset().filter(excluido_em__isnull=True)
