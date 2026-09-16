import { Search } from 'lucide-react';
import styles from './CampoBusca.module.css';

function CampoBusca({ valor, aoAlterar, placeholder = 'Buscar...' }) {
    return (
        <div className={styles.campoBusca}>
            <Search size={14} className={styles.icone} aria-hidden="true" />
            <input
                type="search"
                className={styles.input}
                value={valor}
                onChange={(evento) => aoAlterar(evento.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
            />
        </div>
    );
}

export default CampoBusca;
