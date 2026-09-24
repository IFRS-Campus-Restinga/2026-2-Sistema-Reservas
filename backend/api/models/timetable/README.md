# Models da Timetable (Grade Horária)

Este diretório contém os modelos responsáveis por armazenar e estruturar os dados da grade horária oficial do IFRS (dados raspados do EduPage).

A arquitetura foi projetada para funcionar de forma independente das reservas dos usuários (Abordagem Lazy Loading), servindo como consulta rápida (cache) para renderização no front-end.

## Resumo dos Models

### 1. `PeriodoLetivo`
Gerencia o semestre vigente (ex: "2026/2") e controla o cache do scraping.
- **Por que existe?** Para não perdermos o histórico de aulas quando o semestre virar e para saber quando foi a última vez que os dados foram atualizados do EduPage (campo `ultima_sincronizacao`).

### 2. `HorarioTimetable`
Tabela de mapeamento (De-Para) das horas reais do relógio.
- **Por que existe?** O JSON do EduPage não fornece horários explícitos (vêm como `null`), apenas IDs numéricos (1 a 15). Este modelo traduz o "Período 1" para "07:30 às 08:20". Será necessário criar os horários manualmente através de um Seed Script.

### 3. `CelulaTimetable`
O coração da Timetable. Representa um "bloquinho" de aula que será pintado no calendário do frontend.
- **Como funciona?** Centraliza tudo. Ele liga a sala (`Area`), o tempo (`HorarioTimetable`), e o semestre (`PeriodoLetivo`). Os dados descritivos (Disciplina, Turma, Professor) são salvos como strings simples para evitar complexidade desnecessária. A coluna `duracao_periodos` avisa o frontend se o bloco deve ser "esticado" por mais de uma hora.

---

*Nota: Para que o vínculo funcione, o model `Area` do sistema principal recebeu um campo adicional chamado `edupage_id`, que permite associar a sala do nosso banco com a sala do JSON da grade oficial.*
