export const STATUS_RESERVA_LABEL = {
  confirmada: "Confirmada",
  pendente: "Pendente",
  cancelada: "Cancelada",
  rejeitada: "Rejeitada",
  aguardando_termo: "Aguardando termo",
  aguardando_termo_devolucao: "Aguardando termo de devolução",
  concluida: "Concluída",
};

export const SITUACAO_RESERVA_LABEL = {
  aguardando_confirmacao: 'Aguardando confirmação',
  aguardando_envio_termo: 'Aguardando envio do termo',
  termo_em_analise: 'Termo em análise',
  aguardando_envio_termo_retirada: 'Aguardando envio do termo de retirada',
  confirmada: 'Confirmada',
  aguardando_termo_devolucao: 'Aguardando envio do termo de devolução',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  rejeitada: 'Rejeitada',
};

export function statusReservaApresentado(reserva, agora = new Date()) {
  const situacao = String(reserva?.situacao || reserva?.status || '').toLowerCase();
  if (situacao !== 'aguardando_termo_devolucao') return situacao;

  const inicio = new Date(`${reserva.data}T${reserva.horario_inicio}`);
  if (Number.isNaN(inicio.getTime()) || agora >= inicio) return situacao;
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
