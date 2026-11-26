from django.db import models


class AdministradorAutorizado(models.Model):
    email = models.EmailField(unique=True, verbose_name="Email")
    criado_em = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")

    class Meta:
        db_table = 'administrador_autorizado'
        verbose_name = 'Administrador autorizado'
        verbose_name_plural = 'Administradores autorizados'
        ordering = ['email']

    def __str__(self):
        return self.email
