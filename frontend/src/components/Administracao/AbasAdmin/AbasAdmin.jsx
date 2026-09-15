import styles from './AbasAdmin.module.css';

function AbasAdmin({ abas, abaAtiva, aoSelecionar }) {
  return (
    <nav className={styles.abas} aria-label="Seções da administração">
      {abas.map((aba) => (
        <button
          key={aba.id}
          type="button"
          className={styles.aba}
          onClick={() => aoSelecionar(aba.id)}
          data-ativa={abaAtiva === aba.id}
        >
          {aba.rotulo}
        </button>
      ))}
    </nav>
    /* nav é uma tag HTML para criar uma navegação */
  );
}

export default AbasAdmin;
