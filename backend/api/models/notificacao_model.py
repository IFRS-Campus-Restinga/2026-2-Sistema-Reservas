from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from api.enumerations.tipo_notificacao import TipoNotificacao
from .base_model import BaseModel
from .grupo_model import Grupo
from .reserva_model import Reserva


class Notificacao(BaseModel):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notificacoes",
        verbose_name="Usuário",
    )
    reserva = models.ForeignKey(
        Reserva,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notificacoes",
        verbose_name="Reserva",
    )
    grupo = models.ForeignKey(
        Grupo,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notificacoes",
        verbose_name="Grupo",
    )
    tipo = models.CharField(
        max_length=30,
        choices=TipoNotificacao.choices,
        verbose_name="Tipo",
    )
    titulo = models.CharField(max_length=100, verbose_name="Título")
    mensagem = models.CharField(max_length=255, verbose_name="Mensagem")
    data_referencia = models.DateField(
        null=True,
        blank=True,
        verbose_name="Data de referência",
    )
    lida = models.BooleanField(default=False, verbose_name="Lida")
    criada_em = models.DateTimeField(auto_now_add=True, verbose_name="Criada em")
    lida_em = models.DateTimeField(null=True, blank=True, verbose_name="Lida em")

    def clean(self):
        super().clean()
        if bool(self.reserva_id) == bool(self.grupo_id):
            raise ValidationError(
                "A notificação deve estar vinculada exclusivamente a uma reserva ou a um grupo."
            )

    class Meta:
        db_table = "notificacao"
        verbose_name = "Notificação"
        verbose_name_plural = "Notificações"
        ordering = ["-criada_em"]
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(reserva__isnull=False, grupo__isnull=True)
                    | Q(reserva__isnull=True, grupo__isnull=False)
                ),
                name="notificacao_reserva_ou_grupo_exclusivo",
            ),
            models.UniqueConstraint(
                fields=["usuario", "reserva", "tipo"],
                condition=Q(reserva__isnull=False),
                name="notificacao_unica_usuario_reserva_tipo",
            ),
            models.UniqueConstraint(
                fields=["usuario", "grupo", "tipo"],
                condition=Q(grupo__isnull=False),
                name="notificacao_unica_usuario_grupo_tipo",
            ),
        ]
        indexes = [
            models.Index(fields=["usuario", "lida", "-criada_em"], name="notificacao_usuario_lida_idx"),
        ]

    def __str__(self):
        return f"{self.usuario} - {self.titulo}"
