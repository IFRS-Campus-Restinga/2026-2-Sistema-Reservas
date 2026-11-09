import styles from './BarraFiltros.module.css';

function BarraFiltros({ children, acoes }) {
  return (
    <div className={styles.barra}>
      <div className={styles.filtros}>{children}</div>
      {acoes && <div className={styles.acoes}>{acoes}</div>}
    </div>
  );
}

export default BarraFiltros;
