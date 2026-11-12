import styles from './AbasAdmin.module.css';
import { useUsuario } from '../../../hooks/useUsuario';
import { usePendencias } from '../../../hooks/usePendencias';
import Tooltip from '../../Tooltip/Tooltip';

function AbasAdmin({ abas, abaAtiva, aoSelecionar }) {
  const usuario = useUsuario();
  const pendencias = usePendencias(usuario);
  return (
    <nav className={styles.abas} aria-label="Seções da administração">
      {abas.map((aba) => (
        <Tooltip
          key={aba.id}
          texto={
            aba.id === 'solicitacoes' && pendencias > 0
              ? `${pendencias} ${pendencias === 1 ? 'pendência aguardando análise' : 'pendências aguardando análise'}`
              : undefined
          }
        >
          <button
            type="button"
            className={styles.aba}
            onClick={() => aoSelecionar(aba.id)}
            data-ativa={abaAtiva === aba.id}
            aria-label={aba.id === 'solicitacoes' && pendencias > 0
              ? `${aba.rotulo}: ${pendencias} ${pendencias === 1 ? 'pendência do administrador' : 'pendências do administrador'}`
              : aba.rotulo}
          >
            {aba.rotulo}
            {aba.id === 'solicitacoes' && pendencias > 0 && (
              <span className={styles.contador} aria-hidden="true">
                {pendencias > 9 ? '9+' : pendencias}
              </span>
            )}
          </button>
        </Tooltip>
      ))}
    </nav>
    /* nav é uma tag HTML para criar uma navegação */
  );
}

export default AbasAdmin;
