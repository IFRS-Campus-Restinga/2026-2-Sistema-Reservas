from uuid import uuid4

from django.conf import settings
from django.db import models

from api.enumerations.status_termo import StatusTermo
from .base_model import BaseModel


def caminho_documento(instance, filename):
    if filename.lower().endswith('.docx'):
        extensao = '.docx'
    else:
        extensao = '.pdf'
    return f'termos/{instance.reserva_id}/{uuid4().hex}{extensao}'


class TermoResponsabilidade(BaseModel):
    reserva = models.ForeignKey('Reserva', on_delete=models.PROTECT, related_name='termos')
    arquivo_original = models.FileField(upload_to=caminho_documento, max_length=255)
    arquivo_assinado = models.FileField(upload_to=caminho_documento, max_length=255)
    nome_original = models.CharField(max_length=255)
    status = models.CharField(max_length=10, choices=StatusTermo.choices, default=StatusTermo.PENDENTE)
    atual = models.BooleanField(default=True)
    enviado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='termos_enviados')
    data_envio = models.DateTimeField(auto_now_add=True)
    validado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='termos_analisados', null=True, blank=True)
    data_validacao = models.DateTimeField(null=True, blank=True)
    motivo_rejeicao = models.TextField(blank=True, max_length=1000)

    class Meta:
        ordering = ['-data_envio', '-pk']
        constraints = [
            models.UniqueConstraint(fields=['reserva'], condition=models.Q(atual=True), name='termo_atual_por_reserva'),
        ]
