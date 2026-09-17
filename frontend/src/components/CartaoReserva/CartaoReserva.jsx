import styles from "./CartaoReserva.module.css";
import { formatarDataCurta } from "../../utils/data";
import { STATUS_RESERVA_LABEL } from "../../utils/reserva";
import { TIPO_RESERVA_LABEL } from "../../utils/reserva";

function CartaoReserva({ reserva }) {
  return (
    <div className={styles.cartao}>
      <div className={styles.barraStatus} data-status={reserva.status} />

      <div className={styles.conteudo}>
        <div className={styles.linhaTitulo}>
          <span className={styles.tagTipo} data-tipo={reserva.tipo_reserva}>
            {TIPO_RESERVA_LABEL[reserva.tipo_reserva] ?? reserva.tipo_reserva}
          </span>
          <p className={styles.nome}>{reserva.nome}</p>
        </div>
        <p className={styles.descricao}>{reserva.descricao}</p>
        <p className={styles.horario}>
          {formatarDataCurta(reserva.data)} · {reserva.horario_inicio}–{reserva.horario_fim}
        </p>
      </div>

      <span className={styles.badgeStatus} data-status={reserva.status}>
        {STATUS_RESERVA_LABEL[reserva.status] ?? reserva.status}
      </span>
    </div>
  );
}

export default CartaoReserva;
