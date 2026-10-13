from django.conf import settings
from django.db import models

from api.enumerations.tipo_notificacao import TipoNotificacao
from .base_model import BaseModel
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
        related_name="notificacoes",
        verbose_name="Reserva",
    )
    tipo = models.CharField(
        max_length=30,
        choices=TipoNotificacao.choices,
        verbose_name="Tipo",
    )
    titulo = models.CharField(max_length=100, verbose_name="Título")
    mensagem = models.CharField(max_length=255, verbose_name="Mensagem")
    lida = models.BooleanField(default=False, verbose_name="Lida")
    criada_em = models.DateTimeField(auto_now_add=True, verbose_name="Criada em")
    lida_em = models.DateTimeField(null=True, blank=True, verbose_name="Lida em")

    class Meta:
        db_table = "notificacao"
        verbose_name = "Notificação"
        verbose_name_plural = "Notificações"
        ordering = ["-criada_em"]
        constraints = [
            models.UniqueConstraint(
                fields=["usuario", "reserva", "tipo"],
                name="notificacao_unica_usuario_reserva_tipo",
            )
        ]
        indexes = [
            models.Index(fields=["usuario", "lida", "-criada_em"], name="notificacao_usuario_lida_idx"),
        ]

    def __str__(self):
        return f"{self.usuario} - {self.titulo}"
