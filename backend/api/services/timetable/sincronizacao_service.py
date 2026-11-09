from django.utils import timezone
from api.models.timetable import PeriodoLetivo


def ultima_sincronizacao():
    return (PeriodoLetivo.objects.exclude(ultima_sincronizacao=None)
            .order_by('-ultima_sincronizacao')
            .values_list('ultima_sincronizacao', flat=True).first())


def sincronizacao_concluida():
    instante = timezone.now()
    PeriodoLetivo.objects.filter(ativo=True).update(ultima_sincronizacao=instante)
    return instante
