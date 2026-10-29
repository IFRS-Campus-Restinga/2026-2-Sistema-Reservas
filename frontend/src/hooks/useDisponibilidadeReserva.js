import { useEffect, useMemo, useState } from 'react';
import { consultarOpcoesDisponibilidade } from '../services/disponibilidade';

function chaveMes(mes) {
  return `${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, '0')}`;
}

export function intervaloDisponivel(horarios, inicio, fim) {
  const disponiveis = new Set(horarios || []);
  const [horaInicio, minutoInicio] = inicio.split(':').map(Number);
  const [horaFim, minutoFim] = fim.split(':').map(Number);
  const limite = horaFim * 60 + minutoFim;
  for (let atual = horaInicio * 60 + minutoInicio; atual < limite; atual += 30) {
    const horario = `${String(Math.floor(atual / 60)).padStart(2, '0')}:${String(atual % 60).padStart(2, '0')}`;
    if (!disponiveis.has(horario)) return false;
  }
  return limite > horaInicio * 60 + minutoInicio;
}

export default function useDisponibilidadeReserva({ tipo, recurso, mes, quantidade = 1, excluirReserva }, ativo = true) {
  const mesConsulta = chaveMes(mes);
  const [estado, setEstado] = useState({ chave: '', horarios: {}, erro: '' });
  const chave = JSON.stringify([tipo, recurso, mesConsulta, quantidade, excluirReserva]);

  useEffect(() => {
    if (!ativo || !recurso) return;
    const controle = new AbortController();
    consultarOpcoesDisponibilidade({
      tipo, recurso, mes: mesConsulta, quantidade,
      ...(excluirReserva ? { excluir_reserva: excluirReserva } : {}),
    }, controle.signal)
      .then((dados) => setEstado({ chave, horarios: dados.horarios || {}, erro: '' }))
      .catch((falha) => {
        if (!controle.signal.aborted) setEstado({ chave, horarios: {}, erro: falha.message });
      });
    return () => controle.abort();
  }, [ativo, tipo, recurso, mesConsulta, quantidade, excluirReserva, chave]);

  const atual = estado.chave === chave;
  return useMemo(() => ({
    horarios: atual ? estado.horarios : {},
    diasDisponiveis: atual ? Object.keys(estado.horarios) : [],
    carregando: ativo && Boolean(recurso) && !atual,
    erro: atual ? estado.erro : '',
  }), [atual, estado, ativo, recurso]);
}
