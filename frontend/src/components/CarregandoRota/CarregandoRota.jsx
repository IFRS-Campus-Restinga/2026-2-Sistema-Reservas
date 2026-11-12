import { Spinner } from 'react-bootstrap';
import styles from './CarregandoRota.module.css';

function CarregandoRota({ rotulo = 'Carregando página...' }) {
  return (
    <div className={styles.container} role="status" aria-live="polite">
      <Spinner animation="border" className={styles.spinner} aria-hidden="true" />
      <span className={styles.texto}>{rotulo}</span>
    </div>
  );
}

export default CarregandoRota;
