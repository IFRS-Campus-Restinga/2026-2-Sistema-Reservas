import styles from './CartaoReserva.module.css';
import { formatarDataCurta } from '../../utils/data';
import { STATUS_RESERVA_LABEL, TIPO_RESERVA_LABEL } from '../../utils/reserva';

function CartaoReserva({ reserva, modalidade, periodo, mostrarStatus = true, aoClicar }) {
  const tipo = String(reserva.tipo_reserva || '').toLowerCase();
  const status = String(reserva.status || '').toLowerCase();
  const nomeTipo = modalidade || TIPO_RESERVA_LABEL[tipo] || tipo;
  const Componente = aoClicar ? 'button' : 'div';

  return (
    <Componente
      {...(aoClicar ? { type: 'button', onClick: aoClicar } : {})}
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
          <span className={styles.nome}>{reserva.nome}</span>
        </span>
        <span className={styles.descricao}>{reserva.descricao}</span>
        <span className={styles.horario}>
          {periodo || `${formatarDataCurta(reserva.data)} · ${reserva.horario_inicio}–${reserva.horario_fim}`}
        </span>
      </span>

      {mostrarStatus && (
        <span className={styles.badgeStatus} data-status={status}>
          {STATUS_RESERVA_LABEL[status] || reserva.status}
        </span>
      )}
    </Componente>
  );
}

export default CartaoReserva;
