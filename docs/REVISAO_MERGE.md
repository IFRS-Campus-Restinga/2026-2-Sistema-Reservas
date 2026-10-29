# Revisão do merge com desenvolvimento

Merge revisado: bb3a884 + e0da9f969f008f5fd5ae61961d27574716d249f7.

## Integração corrigida

- Conflitos resolvidos preservando disponibilidade, situações, paginação e expansão de recorrências.
- Consulta compartilhada de disponibilidade considera aulas projetadas da Timetable, respeitando o período letivo.
- Relatório contabiliza ocorrências virtuais, sem duplicar reservas base, e aplica o limite também à expansão.
- Minhas Reservas agrupa a série antes da paginação, por opção explícita do cliente; o contrato anterior continua disponível.
- Bloqueio de edição de recorrências da Timetable usa a relação correta com ReservaArea. Recorrências manuais continuam canceláveis.
- Expansão por teclado do cartão não abre simultaneamente o detalhe.

## Verificações

39 testes passaram com migrações normais: api.tests e as classes VeiculoApiTests, BlocoAreaApiTests, RecursoGeralApiTests e AgendaAreaApiTests da suíte local test_backend.
Os testes adicionais de integração estão em backend/api/tests/test_merge_integracao.py.
Build de produção concluído. Django sem problemas e makemigrations --check --dry-run sem alterações.

## Limites e pendências

O lint geral mantém sete erros já encontrados antes do merge: seis react-hooks/set-state-in-effect nos modais e um import LogOut sem uso na SideBar. O build avisa sobre bundle acima de 500 kB.
Não foi realizada nesta revisão validação visual em navegador nem integração real com HUB/EduPage. A demonstração foi testada nos endpoints para os quatro perfis e com o modo desativado; não substitui um teste completo de sessão no navegador.
