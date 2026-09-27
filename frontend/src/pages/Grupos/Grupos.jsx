import GruposGerenciador from '../../components/Grupos/GruposGerenciador/GruposGerenciador';
import styles from './Grupos.module.css';

function Grupos() {
    return (
        <div className={styles.pagina}>
            <div className={styles.conteudo}>
                <GruposGerenciador apenasMeusGrupos />
            </div>
        </div>
    );
}

export default Grupos;
