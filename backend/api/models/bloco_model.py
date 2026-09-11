from django.db import models
from .base_model import BaseModel
from api.enumerations.acessibilidade import Acessibilidade


class Bloco(BaseModel):
    """
    Representa a entidade de um Bloco físico do campus/estabelecimento no banco de dados.

    Herda os campos de auditoria e identificação de BaseModel.

    Atributos:
        numero (CharField): Código numérico de identificação do bloco (no máximo 2 dígitos).
        nome (CharField): Nome descritivo do bloco (máximo 100 caracteres).
        banheiro (BooleanField): Indica a presença de estrutura sanitária (padrão: True).
        acessibilidade (JSONField): Lista com as opções de acessibilidade disponíveis (padrão: lista vazia).
    """

    class Meta:
        db_table = 'bloco'
        verbose_name = 'Bloco'
        verbose_name_plural = 'Blocos'

    numero = models.CharField(max_length=2)
    nome = models.CharField(max_length=100)
    banheiro = models.BooleanField(default=True)
    acessibilidade = models.JSONField(default=list, blank=True)

    def __str__(self):
        """
        Retorna a representação em texto do objeto Bloco.

        Returns:
            str: Identificador formatado como 'Bloco {numero} - {nome}'.
        """
        return f"Bloco {self.numero} - {self.nome}"