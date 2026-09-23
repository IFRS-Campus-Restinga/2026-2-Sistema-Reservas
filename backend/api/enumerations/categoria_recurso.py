from django.db import models


class CategoriaRecurso(models.TextChoices):
    TECNOLOGIA = "TECNOLOGIA", "Tecnologia e audiovisual"
    ESPORTES = "ESPORTES", "Materiais esportivos"
    MANUTENCAO = "MANUTENCAO", "Manutenção"
    APOIO = "APOIO", "Materiais de apoio"
    OUTROS = "OUTROS", "Outros"
