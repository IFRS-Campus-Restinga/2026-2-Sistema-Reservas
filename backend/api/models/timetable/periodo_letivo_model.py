from django.db import models
from api.models.base_model import BaseModel

class PeriodoLetivo(BaseModel):
    """
    Representa o semestre ou período escolar vigente.
    Controla também quando foi a última sincronização dos dados do EduPage.
    """

    class Meta:
        db_table = 'periodo_letivo'
        verbose_name = 'Período Letivo'
        verbose_name_plural = 'Períodos Letivos'

    nome = models.CharField(
        max_length=20,
        null=False,
        blank=False,
        help_text="Nome do período letivo (ex: 2026/2)"
    )
    data_inicio = models.DateField(
        null=False,
        blank=False,
        help_text="Data de início do semestre"
    )
    data_fim = models.DateField(
        null=False,
        blank=False,
        help_text="Data de fim do semestre"
    )
    ativo = models.BooleanField(
        default=False,
        help_text="Indica se é o semestre atual/vigente"
    )
    ultima_sincronizacao = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Data e hora da última varredura da timetable da EduPage"
    )

    def __str__(self):
        return f"{self.nome} ({'Ativo' if self.ativo else 'Inativo'})"

    def clean(self):
        super().clean()
        if self.nome:
            self.nome = self.nome.strip()

    def save(self, *args, **kwargs):
        self.full_clean()
        
        # Garante que apenas UM período letivo pode ser ativo por vez
        if self.ativo:
            PeriodoLetivo.objects.filter(ativo=True).update(ativo=False)
            
        super().save(*args, **kwargs)
