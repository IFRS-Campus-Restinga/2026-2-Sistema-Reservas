from django.core.management.base import BaseCommand
from django.db import transaction

from api.enumerations import StatusRecurso
from api.models.veiculo_model import Veiculo


VEICULOS = [
    {
        'nome': 'Van do Campus',
        'placa': 'ABC1D23',
        'marca': 'Renault',
        'modelo': 'Master',
        'capacidade': 16,
        'combustivel': 'Diesel',
        'quilometragem': 42500,
        'cor': 'Branco',
        'observacao': 'Transporte de estudantes.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Carro Administrativo',
        'placa': 'DEF4567',
        'marca': 'Chevrolet',
        'modelo': 'Onix',
        'capacidade': 5,
        'combustivel': 'Flex',
        'quilometragem': 18000,
        'cor': 'Prata',
        'observacao': 'Deslocamentos administrativos.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Van de Apoio',
        'placa': 'GHI2J34',
        'marca': 'Fiat',
        'modelo': 'Ducato',
        'capacidade': 15,
        'combustivel': 'Diesel',
        'quilometragem': 76000,
        'cor': 'Branco',
        'observacao': 'Revisão periódica.',
        'status': StatusRecurso.MANUTENCAO,
    },
    {
        'nome': 'Caminhonete de Campo',
        'placa': 'JKL8901',
        'marca': 'Toyota',
        'modelo': 'Hilux',
        'capacidade': 5,
        'combustivel': 'Diesel',
        'quilometragem': 31500,
        'cor': 'Cinza',
        'observacao': 'Atividades de campo.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Micro-ônibus Escolar',
        'placa': 'MNO3P45',
        'marca': 'Mercedes-Benz',
        'modelo': 'Sprinter',
        'capacidade': 20,
        'combustivel': 'Diesel',
        'quilometragem': 95000,
        'cor': 'Amarelo',
        'observacao': 'Visitas técnicas e eventos.',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Carro de Apoio',
        'placa': 'PQR2345',
        'marca': 'Volkswagen',
        'modelo': 'Gol',
        'capacidade': 5,
        'combustivel': 'Flex',
        'quilometragem': 128000,
        'cor': 'Vermelho',
        'observacao': 'Fora de operação.',
        'status': StatusRecurso.INATIVO,
    },
    {
        'nome': 'Sedan da Direção',
        'placa': 'STU4V56',
        'marca': 'Toyota',
        'modelo': 'Corolla',
        'capacidade': 5,
        'combustivel': 'Flex',
        'quilometragem': 24000,
        'cor': 'Preto',
        'observacao': '',
        'status': StatusRecurso.ATIVO,
    },
    {
        'nome': 'Utilitário de Manutenção',
        'placa': 'VWX6789',
        'marca': 'Fiat',
        'modelo': 'Fiorino',
        'capacidade': 2,
        'combustivel': 'Flex',
        'quilometragem': 58000,
        'cor': 'Branco',
        'observacao': 'Transporte de ferramentas.',
        'status': StatusRecurso.MANUTENCAO,
    },
]


def popular_veiculos():
    criados = 0
    for dados in VEICULOS:
        if Veiculo.objects.filter(placa=dados['placa']).exists():
            continue
        veiculo = Veiculo(**dados)
        veiculo.full_clean()
        veiculo.save()
        criados += 1
    return criados


# Acrescente aqui as próximas funções, na ordem das dependências:
# popular_blocos antes de popular_areas, por exemplo.
POPULADORES = [
    ('Veículos', popular_veiculos),
]


class Command(BaseCommand):
    help = 'Popula o banco com dados fictícios, preservando registros existentes.'

    @transaction.atomic
    def handle(self, *args, **options):
        for nome, popular in POPULADORES:
            quantidade = popular()
            self.stdout.write(self.style.SUCCESS(
                f'{nome}: {quantidade} registro(s) criado(s).'
            ))
