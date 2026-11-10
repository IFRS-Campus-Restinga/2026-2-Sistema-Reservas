import styles from './AbasAdmin.module.css';
import { useUsuario } from '../../../hooks/useUsuario';
import { usePendencias } from '../../../hooks/usePendencias';

function AbasAdmin({ abas, abaAtiva, aoSelecionar }) {
  const usuario = useUsuario();
  const pendencias = usePendencias(usuario);
  return (
    <nav className={styles.abas} aria-label="Seções da administração">
      {abas.map((aba) => (
        <button
          key={aba.id}
          type="button"
          className={styles.aba}
          onClick={() => aoSelecionar(aba.id)}
          data-ativa={abaAtiva === aba.id}
          aria-label={aba.id === 'solicitacoes' && pendencias > 0
            ? `${aba.rotulo}: ${pendencias} pendências do administrador`
            : aba.rotulo}
          title={aba.id === 'solicitacoes' && pendencias > 0
            ? `${pendencias} pendências do administrador`
            : undefined}
        >
          {aba.rotulo}
          {aba.id === 'solicitacoes' && pendencias > 0 && (
            <span className={styles.contador} aria-hidden="true">
              {pendencias > 9 ? '9+' : pendencias}
            </span>
          )}
        </button>
      ))}
    </nav>
    /* nav é uma tag HTML para criar uma navegação */
  );
}

export default AbasAdmin;
