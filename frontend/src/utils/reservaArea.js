import { TIPO_AREA_LABEL } from './tipoArea';
import { STATUS_RECURSO_LABEL } from './statusRecurso';
import { PERIODOS_POR_TURNO } from './periodosAula';

// Horários de 07:00 a 22:30, de meia em meia hora
export const HORARIOS = Array.from({ length: 32 }, (_, indice) => {
  const total = 7 * 60 + indice * 30;
  const horas = String(Math.floor(total / 60)).padStart(2, '0');
  const minutos = String(total % 60).padStart(2, '0');

  return `${horas}:${minutos}`;
});

function blocoDaArea(area, blocos) {
  const blocoId = typeof area.bloco === 'object' ? area.bloco?.id : area.bloco;
  return blocos.find((bloco) => String(bloco.id) === String(blocoId));
}

// Grupos aceitos pelo componente Select, com as áreas inativas desabilitadas
export function gruposAreaPorBloco(areas, blocos) {
  return [...blocos]
    .sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
    .map((bloco) => ({
      rotulo: bloco.nome,
      opcoes: areas
        .filter((area) => blocoDaArea(area, blocos)?.id === bloco.id)
        .map((area) => ({
          valor: String(area.id),
          rotulo: `${area.nome} · ${TIPO_AREA_LABEL[area.tipo] || area.tipo} · ${area.capacidade} pax${
            area.status !== 'ATIVO'
              ? ` (${STATUS_RECURSO_LABEL[area.status]?.toLowerCase() || ''})`
              : ''
          }`,
          desabilitado: area.status !== 'ATIVO',
        })),
    }))
    .filter((grupo) => grupo.opcoes.length > 0);
}

// Preenche os períodos entre o primeiro e o último selecionados
export function ajustarPeriodosContiguos(ids, periodosDoTurno) {
  if (ids.length === 0) return ids;

  const indices = ids
    .map((id) => periodosDoTurno.findIndex((periodo) => periodo.id === id))
    .filter((indice) => indice !== -1);

  return periodosDoTurno
    .slice(Math.min(...indices), Math.max(...indices) + 1)
    .map((periodo) => periodo.id);
}

// (["manha-1", "manha-2"], periodos da manhã) -> { inicio: "07:30", fim: "09:10" }
export function horarioDosPeriodos(ids, periodosDoTurno) {
  const indices = ids
    .map((id) => periodosDoTurno.findIndex((periodo) => periodo.id === id))
    .filter((indice) => indice !== -1);

  if (!indices.length) return { inicio: '', fim: '' };

  return {
    inicio: periodosDoTurno[Math.min(...indices)].inicio,
    fim: periodosDoTurno[Math.max(...indices)].fim,
  };
}

// ("07:30", "09:10") -> { turno: "manha", ids: ["manha-1", "manha-2"] } ou null
export function periodosDoHorario(inicio, fim) {
  for (const [turno, periodos] of Object.entries(PERIODOS_POR_TURNO)) {
    const primeiro = periodos.findIndex((periodo) => periodo.inicio === inicio);
    const ultimo = periodos.findIndex((periodo) => periodo.fim === fim);

    if (primeiro !== -1 && ultimo >= primeiro) {
      return {
        turno,
        ids: periodos.slice(primeiro, ultimo + 1).map((periodo) => periodo.id),
      };
    }
  }

  return null;
}
