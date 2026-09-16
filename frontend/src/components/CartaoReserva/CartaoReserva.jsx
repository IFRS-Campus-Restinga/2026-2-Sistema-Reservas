import styles from "./CartaoReserva.module.css";
import { formatarDataCurta } from "../../utils/data";

const STATUS_LABEL = {
  confirmada: "Confirmada",
  pendente: "Pendente",
};

const TIPO_RESERVA_LABEL = {
  interna: "Interna",
  externa: "Externa",
};

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
        {STATUS_LABEL[reserva.status] ?? reserva.status}
      </span>
    </div>
  );
}

export default CartaoReserva;
