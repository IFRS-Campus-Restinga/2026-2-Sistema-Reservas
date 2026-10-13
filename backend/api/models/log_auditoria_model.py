from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models

from api.enumerations.auditoria_enumerations import AcaoAuditoria, EntidadeAuditoria
from api.validators.log_auditoria_validator import validar_alteracao_log_auditoria, validar_exclusao_log_auditoria
from .base_model import BaseModel


class LogAuditoria(BaseModel):
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='acoes_auditadas',
        verbose_name="Admin",
        help_text="Administrador que executou a ação."
    )
    acao = models.CharField(
        max_length=12,
        choices=AcaoAuditoria.choices,
        verbose_name="Ação"
    )
    entidade = models.CharField(
        max_length=30,
        choices=EntidadeAuditoria.choices,
        verbose_name="Entidade"
    )
    objeto_id = models.PositiveBigIntegerField(
        null=True,
        blank=True,
        verbose_name="ID do objeto",
        help_text="Vazio quando a ação não se refere a um registro específico (ex.: sincronização)."
    )
    descricao = models.CharField(
        max_length=255,
        verbose_name="Descrição",
        help_text="Nome legível do objeto no momento da ação."
    )
    usuario_afetado = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='auditorias_recebidas',
        verbose_name="Usuário afetado"
    )
    dados_antes = models.JSONField(
        null=True,
        blank=True,
        encoder=DjangoJSONEncoder,
        verbose_name="Dados antes"
    )
    dados_depois = models.JSONField(
        null=True,
        blank=True,
        encoder=DjangoJSONEncoder,
        verbose_name="Dados depois"
    )
    data = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Data e hora"
    )

    def __str__(self):
        return f"{self.admin} - {self.get_acao_display()} - {self.get_entidade_display()}"

    def save(self, *args, **kwargs):
        validar_alteracao_log_auditoria(self)
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        validar_exclusao_log_auditoria()

    class Meta:
        db_table = 'log_auditoria'
        verbose_name = 'Log de auditoria'
        verbose_name_plural = 'Logs de auditoria'
        ordering = ['-data']
        indexes = [
            models.Index(fields=['-data'], name='log_auditoria_data_idx'),
            models.Index(fields=['entidade', 'objeto_id'], name='log_auditoria_objeto_idx'),
        ]
