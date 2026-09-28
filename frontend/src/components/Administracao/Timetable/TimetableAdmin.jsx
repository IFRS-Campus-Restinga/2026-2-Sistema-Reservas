import { useEffect, useState, useMemo } from 'react';
import { useTimetableStore } from '../../../store/timetableStore';
import styles from './TimetableAdmin.module.css';

const PERIODOS_MATRIZ = [
  { id: 1, rotulo: '1', tempo: '7:30 - 8:20' },
  { id: 2, rotulo: '2', tempo: '8:20 - 9:10' },
  { id: 3, rotulo: '3', tempo: '9:10 - 10:00' },
  { id: 4, rotulo: '4', tempo: '10:20 - 11:10' },
  { id: 5, rotulo: '5', tempo: '11:10 - 12:00' },
  { id: 6, rotulo: 'Entre Turnos', tempo: '12:00 - 13:30', isDivisor: true },
  { id: 7, rotulo: '1', tempo: '13:30 - 14:20' },
  { id: 8, rotulo: '2', tempo: '14:20 - 15:10' },
  { id: 9, rotulo: '3', tempo: '15:10 - 16:00' },
  { id: 10, rotulo: '4', tempo: '16:20 - 17:10' },
  { id: 11, rotulo: '5', tempo: '17:10 - 18:00' },
  { id: 12, rotulo: '0', tempo: '18:10 - 19:00' },
  { id: 13, rotulo: '1', tempo: '19:00 - 19:50' },
  { id: 14, rotulo: '2', tempo: '19:50 - 20:40' },
  { id: 15, rotulo: '3', tempo: '20:50 - 21:40' },
  { id: 16, rotulo: '4', tempo: '21:40 - 22:30' },
];

const DIAS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];
const DIAS_ROTULOS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']; // Exatamente como na imagem original

// Função para mapear o ID do edupage (1 a 16) para a linha do CSS Grid (linha 1 é o cabeçalho)
const getGridRowStart = (id) => id + 1;

function TimetableAdmin() {
  const { timetableData, isLoading, error, fetchTimetable } = useTimetableStore();
  const [salaSelecionada, setSalaSelecionada] = useState('');

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable]);

  const salas = useMemo(() => Object.keys(timetableData || {}).sort(), [timetableData]);
  const salaAtual = salaSelecionada || (salas.length > 0 ? salas[0] : '');
  const dadosSala = timetableData?.[salaAtual] || {};

  if (isLoading) return <div className={styles.loading}>Carregando grade horária...</div>;
  if (error) return <div className={styles.error}>Erro ao carregar grade: {error}</div>;
  if (!timetableData || Object.keys(timetableData).length === 0) {
    return <div className={styles.empty}>Nenhuma aula encontrada no sistema.</div>;
  }

  // Prepara os cartões de aulas e slots livres
  const renderCards = () => {
    const cards = [];

    DIAS.forEach((dia, diaIndex) => {
      const aulasDoDia = dadosSala[dia] || [];
      const colIndex = diaIndex + 2; // Coluna 1 é a dos rótulos de tempo, então dias começam na col 2
      const periodosOcupados = new Set();

      // Primeiro, processamos as aulas ocupadas
      aulasDoDia.forEach(aula => {
        const linhaInicial = aula.linha_inicial;
        const tamanho = aula.tamanho_bloco || 1;
        
        // Marca os períodos cobertos por esta aula
        for (let i = 0; i < tamanho; i++) {
          periodosOcupados.add(linhaInicial + i);
        }

        const gridRowStart = getGridRowStart(linhaInicial);
        // Remove os ':00' dos segundos
        const formatarHora = (hora) => hora ? hora.substring(0, 5) : '';
        
        // Atribui uma cor baseada no nome da disciplina usando hash simples para diferenciar (opcional)
        // Como o original tem cores, vamos manter uma classe genérica e o CSS aplica um estilo
        
        cards.push(
          <div 
            key={`aula-${aula.id}`}
            className={styles.cardAula} 
            style={{ 
              gridColumn: colIndex, 
              gridRow: `${gridRowStart} / span ${tamanho}` 
            }}
          >
            <div className={styles.tempoTop}>
              {formatarHora(aula.horario_inicio)} - {formatarHora(aula.horario_fim)}
            </div>
            <div className={styles.disciplinaCentro}>{aula.disciplina}</div>
            <div className={styles.rodape}>
              <span className={styles.turmaBottom}>{aula.turma}</span>
              <span className={styles.professorBottom}>{aula.professor}</span>
            </div>
          </div>
        );
      });

      // Em seguida, geramos os blocos "Livre" para os períodos vazios
      PERIODOS_MATRIZ.forEach(periodo => {
        if (periodo.isDivisor) return; // Pula o divisor Entre Turnos
        if (!periodosOcupados.has(periodo.id)) {
          cards.push(
            <div 
              key={`livre-${dia}-${periodo.id}`}
              className={styles.cardLivre}
              style={{
                gridColumn: colIndex,
                gridRow: getGridRowStart(periodo.id)
              }}
            >
              Livre
            </div>
          );
        }
      });
    });

    return cards;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Grade Horária do EduPage</h2>
        <div className={styles.filtros}>
          <label>Selecione a Sala: </label>
          <select value={salaAtual} onChange={(e) => setSalaSelecionada(e.target.value)}>
            {salas.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.gridContainer}>
        {/* Cabeçalho da Grade */}
        <div className={styles.gridHeaderVazio} style={{ gridColumn: 1, gridRow: 1 }}></div>
        {DIAS_ROTULOS.map((dia, idx) => (
          <div key={`header-${dia}`} className={styles.gridHeaderDia} style={{ gridColumn: idx + 2, gridRow: 1 }}>
            {dia}
          </div>
        ))}

        {/* Coluna Lateral (Períodos e Tempos) */}
        {PERIODOS_MATRIZ.map(periodo => {
          if (periodo.isDivisor) {
            return (
              <div 
                key={`periodo-${periodo.id}`} 
                className={styles.gridTurnoDivisor} 
                style={{ gridColumn: '1 / -1', gridRow: getGridRowStart(periodo.id) }}
              >
                <div className={styles.turnoLabel}>{periodo.rotulo}</div>
                <div className={styles.turnoTime}>{periodo.tempo}</div>
              </div>
            );
          }
          
          return (
            <div 
              key={`periodo-${periodo.id}`} 
              className={styles.gridLateral}
              style={{ gridColumn: 1, gridRow: getGridRowStart(periodo.id) }}
            >
              <div className={styles.lateralNum}>{periodo.rotulo}</div>
              <div className={styles.lateralTime}>{periodo.tempo}</div>
            </div>
          );
        })}

        {/* Renderiza as aulas e os blocos livres */}
        {renderCards()}
      </div>
    </div>
  );
}

export default TimetableAdmin;
