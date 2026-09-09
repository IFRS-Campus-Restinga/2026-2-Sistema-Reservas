from django.db import models


class Papel(models.TextChoices):
    ADMIN = 'admin', 'Administrador'
    SERVIDOR = 'servidor', 'Servidor'
    ALUNO = 'aluno', 'Aluno'
    CONVIDADO = 'convidado', 'Convidado'
