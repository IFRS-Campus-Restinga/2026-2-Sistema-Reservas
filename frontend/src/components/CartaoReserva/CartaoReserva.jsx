import { useEffect, useState } from 'react';
import { ChevronDown, FileText, Repeat } from 'lucide-react';
import styles from './CartaoReserva.module.css';
import { formatarDataCurta } from '../../utils/data';
import {
  SITUACAO_RESERVA_LABEL,
  TIPO_RESERVA_LABEL,
  statusReservaApresentado,
  termoRetiradaDisponivel,
} from '../../utils/reserva';

function CartaoReserva({
  reserva,
  modalidade,
  periodo,
  mostrarStatus = true,
  mostrarDisponibilidadeRetirada = false,
  aoClicar,
  expandido = false,
  aoAlternarExpansao,
}) {
  const [agora, setAgora] = useState(() => new Date());
  const tipo = String(reserva.tipo_reserva || '').toLowerCase();
  const status = statusReservaApresentado(reserva, agora);
  const nomeTipo = modalidade || TIPO_RESERVA_LABEL[tipo] || tipo;
  const ehRecorrente = Boolean(reserva.recorrencia);
  const usaDivClicavel = Boolean(aoClicar && aoAlternarExpansao);
  const Componente = aoClicar && !usaDivClicavel ? 'button' : 'div';

  useEffect(() => {
    if (!mostrarDisponibilidadeRetirada || String(reserva.status || '').toUpperCase() !== 'CONFIRMADA') return undefined;

    const inicio = new Date(`${reserva.data}T${reserva.horario_inicio}`);
    const horarioDisponibilidade = inicio.getTime() - 60 * 60 * 1000;
    if (Number.isNaN(horarioDisponibilidade) || horarioDisponibilidade <= Date.now()) return undefined;

    const temporizador = setTimeout(() => setAgora(new Date()), horarioDisponibilidade - Date.now() + 25);
    return () => clearTimeout(temporizador);
  }, [mostrarDisponibilidadeRetirada, reserva.status, reserva.data, reserva.horario_inicio]);

  const termoDisponivel = mostrarDisponibilidadeRetirada && termoRetiradaDisponivel(reserva, agora);

  const propriedadesInteracao = !aoClicar
    ? {}
    : usaDivClicavel
      ? {
          role: 'button',
          tabIndex: 0,
          onClick: aoClicar,
          onKeyDown: (evento) => {
            if (evento.target !== evento.currentTarget) return;
            if (evento.key === 'Enter' || evento.key === ' ') {
              evento.preventDefault();
              aoClicar();
            }
          },
        }
      : { type: 'button', onClick: aoClicar };

  return (
    <Componente
      {...propriedadesInteracao}
      className={`${styles.cartao} ${modalidade ? styles.porModalidade : ''} ${aoClicar ? styles.clicavel : ''}`}
      data-tipo={tipo}
      aria-label={aoClicar ? `Ver detalhes da reserva ${reserva.nome}` : undefined}
    >
      <span
        className={styles.barraStatus}
        data-status={status}
        data-tipo={modalidade ? tipo : undefined}
        aria-hidden="true"
      />

      <span className={styles.conteudo}>
        <span className={styles.linhaTitulo}>
          <span className={styles.tagTipo} data-tipo={modalidade ? 'modalidade' : tipo}>
            {nomeTipo}
          </span>
          {ehRecorrente && (
            <span className={styles.tagRecorrente} title="Reserva com repetição agendada">
              <Repeat size={11} />
              Recorrente
            </span>
          )}
          <span className={styles.nome}>{reserva.nome}</span>
        </span>
        <span className={styles.descricao}>{reserva.descricao}</span>
        <span className={styles.horario}>
          {periodo || `${formatarDataCurta(reserva.data)} · ${reserva.horario_inicio}–${reserva.horario_fim}`}
        </span>
        {termoDisponivel && (
          <span className={styles.avisoRetirada} role="status">
            <FileText size={13} /> Termo de retirada disponível para envio
          </span>
        )}
      </span>

      <span className={styles.acoesDireita}>
        {mostrarStatus && (
          <span className={styles.badgeStatus} data-status={status}>
            {SITUACAO_RESERVA_LABEL[status] || reserva.status}
          </span>
        )}
        {aoAlternarExpansao && (
          <button
            type="button"
            className={styles.botaoSanfona}
            data-expandido={expandido}
            onClick={(evento) => {
              evento.stopPropagation();
              aoAlternarExpansao();
            }}
            aria-expanded={expandido}
            aria-label={expandido ? 'Recolher todas as reservas' : 'Expandir todas as reservas'}
            title={expandido ? 'Recolher reservas' : 'Mostrar todas as reservas'}
          >
            <ChevronDown size={16} className={styles.iconeSanfona} />
          </button>
        )}
      </span>
    </Componente>
  );
}

export default CartaoReserva;
