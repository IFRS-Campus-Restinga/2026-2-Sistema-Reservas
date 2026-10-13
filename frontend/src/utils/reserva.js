export const STATUS_RESERVA_LABEL = {
  confirmada: "Confirmada",
  pendente: "Pendente",
  cancelada: "Cancelada",
  rejeitada: "Rejeitada",
  aguardando_termo: "Aguardando termo",
  aguardando_termo_devolucao: "Aguardando termo de devolução",
  concluida: "Concluída",
};

export function statusReservaApresentado(reserva, agora = new Date()) {
  const status = String(reserva?.status || '').toLowerCase();
  if (status !== 'aguardando_termo_devolucao') return status;

  const inicio = new Date(`${reserva.data}T${reserva.horario_inicio}`);
  if (Number.isNaN(inicio.getTime()) || agora >= inicio) return status;
  return 'confirmada';
}

export function termoRetiradaDisponivel(reserva, agora = new Date()) {
  if (String(reserva?.status || '').toUpperCase() !== 'CONFIRMADA') return false;

  const inicio = new Date(`${reserva.data}T${reserva.horario_inicio}`);
  if (Number.isNaN(inicio.getTime())) return false;
  return agora >= new Date(inicio.getTime() - 60 * 60 * 1000);
}

export const TIPO_RESERVA_LABEL = {
  interna: "Interna",
  externa: "Externa",
};
