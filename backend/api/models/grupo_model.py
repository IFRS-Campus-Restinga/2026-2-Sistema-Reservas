from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from accounts.enumerations import Papel
from api.enumerations.tipo_recurso_reservavel import TipoRecursoReservavel
from api.validators.grupo_validator import validar_nome_grupo
from .base_model import BaseModel
from .tipo_recurso_model import TipoRecurso


class Grupo(BaseModel):
    nome = models.CharField(
        max_length=100,
        validators=[validar_nome_grupo],
        null=False,
        blank=False,
        help_text="Nome do grupo de autorização."
    )
    tipo_membro_permitido = models.CharField(
        max_length=12,
        choices=[(Papel.SERVIDOR, Papel.SERVIDOR.label), (Papel.ALUNO, Papel.ALUNO.label)],
        null=False,
        blank=False,
        help_text="Papel de usuário (servidor ou aluno) autorizado a ser membro deste grupo."
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
        related_name='grupos_autorizados',
        null=True,
        blank=True,
        help_text=(
            "Tipo específico de Recurso Geral autorizado (ex.: bola). "
            "Obrigatório quando tipo_recurso_autorizado = RECURSO_GERAL, "
            "e deve ficar vazio nos demais casos."
        )
    )
    data_inicio_validade = models.DateField(
        null=False,
        blank=False,
        help_text="Data a partir da qual a autorização do grupo é válida."
    )
    data_fim_validade = models.DateField(
        null=True,
        blank=True,
        help_text="Data de expiração da autorização do grupo (opcional)."
    )
    criador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='grupos_criados',
        null=False,
        blank=False,
        help_text="Usuário que criou o grupo."
    )

    def __str__(self):
        return self.nome

    @property
    def grupo_relacionado(self):
        return self

    def clean(self):
        super().clean()
        if self.nome:
            self.nome = self.nome.strip()
        if self.pk:
            tipo_membro_permitido_original = Grupo.objects.filter(pk=self.pk).values_list(
                'tipo_membro_permitido', flat=True
            ).first()
            if tipo_membro_permitido_original is not None and tipo_membro_permitido_original != self.tipo_membro_permitido:
                raise ValidationError(
                    {"tipo_membro_permitido": "Não é possível alterar o tipo de membro permitido de um grupo já criado."}
                )
        if self.data_inicio_validade and self.data_fim_validade and self.data_fim_validade < self.data_inicio_validade:
            raise ValidationError(
                {"data_fim_validade": "A data de fim de validade não pode ser anterior à data de início."}
            )
        if self.tipo_recurso_autorizado == TipoRecursoReservavel.RECURSO_GERAL and not self.tipo_recurso_id:
            raise ValidationError(
                {"tipo_recurso": "É obrigatório informar o tipo de recurso geral autorizado (por exemplo, bola)."}
            )
        if self.tipo_recurso_autorizado != TipoRecursoReservavel.RECURSO_GERAL and self.tipo_recurso_id:
            raise ValidationError(
                {"tipo_recurso": "Este campo só deve ser preenchido quando o tipo de recurso autorizado for Recurso Geral."}
            )
        if self.pk and self.data_inicio_validade:
            fora_da_janela = Q(data_fim_validade__lt=self.data_inicio_validade)
            if self.data_fim_validade:
                fora_da_janela |= Q(data_fim_validade__gt=self.data_fim_validade)
            if self.membros.filter(fora_da_janela).exists():
                raise ValidationError(
                    {"data_fim_validade": "Não é possível alterar a validade do grupo: há membros com uma data de expiração fora da nova janela."}
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
            db_table = 'grupo'
            verbose_name = 'Grupo'
            verbose_name_plural = 'Grupos'
