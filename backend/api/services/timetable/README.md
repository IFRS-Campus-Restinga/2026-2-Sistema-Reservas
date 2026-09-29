Mapeamento de scraping da timetable

O JSON retornado pelo endpoint principal contém um banco de dados relacional que deve ser desnormalizado para montar a timetable.

    Endpoint principal: "https://restinga.edupage.org/timetable/"

    Exemplo de JSON Retornado pelo endpoint principal:
    [
        {
            "id": "classrooms",  > Salas
            "data_rows": [
            {
                "id": "-61",
                "name": "516 [Artes]",
                "short": "516",
                "color": "#DDFFDD"
            }
            ]
        },
        {
            "id": "periods",    > períodos
            "data_rows": [
            {
                "id": "1",
                "name": "1",
                "short": "1",
                "perioddata": null,     > Os horários de início e final de cada períodos deverá ser criado manualmente através de um seed-script
                                          na tabela HorarioTimetable, pois eles sempre são capturados com valor nulo.
                "starttime": null,
                "endtime": null
            }
            ]
        },
        {
            "id": "cards",      > cartões (representam as células da timetable)
            "data_rows": [
            {
                "id": "*1",
                "lessonid": "*1",
                "period": "4",  > indica o id do período que a aula COMEÇA (10:20 neste caso)
                "days": "00100", >  Dias da semana com o seguinte padrão:

                                    10000 = Segunda-feira
                                    01000 = Terça-feira
                                    00100 = Quarta-feira
                                    00010 = Quinta-feira
                                    00001 = Sexta-feira

                
                "weeks": "1",
                "classroomids": ["-61"]
            }
            ]
        },
        {
            "id": "lessons",        > aulas
            "data_rows": [
            {
                "id": "*1",
                "subjectid": "-209",
                "teacherids": ["*8"], <
                "classids": ["*1"], <
                "durationperiods": 2, <
                "count": 1
            }
            ]
        },
        {
            "id": "subjects",       > disciplinas
            "data_rows": [
            {
                "id": "-209",
                "name": "Artes",
                "short": "Artes"
            }
            ]
        },
        {
            "id": "teachers",       > professores
            "data_rows": [
            {
                "id": "*8",
                "name": "Angela Zanotelli Cagliari",
                "short": "Angela Z. Cagliari"
            }
            ]
        },
        {
            "id": "classes",        > turmas
            "data_rows": [
            {
                "id": "*1",
                "name": "111",
                "short": "111"
            }
            ]
        }
    ]

    -------------------------------

    Exemplo de dado desnormalizado (montado):

{
    "edupage_card_id": "*1",                    > Extraído do 'id' da tabela 'cards'
    "disciplina": "Artes",                      > Traduzido da tabela 'subjects' (subjectid: "-209")
    "professor": "Angela Zanotelli Cagliari",   > Traduzido da tabela 'teachers' (teacherids: ["*8"])
    "turma": "111",                             > Traduzido da tabela 'classes' (classids: ["*1"])
    "dia_semana": "Quarta-feira",               > Convertido do bitmask "00100" do campo 'days' da tabela 'cards'
    "duracao_periodos": 2,                      > Extraído do 'durationperiods' da tabela 'lessons'
    "periodo_edupage_id": 4,                    > Extraído do 'period' da tabela 'cards'. Nosso sistema cruzará com o model HorarioTimetable
    "sala_edupage_id": "-61"                    > Extraído do 'classroomids' da tabela 'cards'. Nosso sistema cruzará com a edupage_id da Area
}