import { useState } from 'react';
import TiposRecursoAdmin from './TiposRecursoAdmin';
import CategoriasRecursoAdmin from './CategoriasRecursoAdmin';
import styles from './CadastrosAdmin.module.css';

// Cadastros auxiliares usados pelos outros módulos (recursos, áreas...)
const SECOES = [
    { id: 'tipos-recurso', rotulo: 'Tipos de recurso', Componente: TiposRecursoAdmin },
    { id: 'categorias-recurso', rotulo: 'Categorias de recurso', Componente: CategoriasRecursoAdmin },
];

function CadastrosAdmin() {
    const [secaoAtiva, setSecaoAtiva] = useState(SECOES[0].id);
    const { Componente } = SECOES.find((secao) => secao.id === secaoAtiva);

    return (
        <div className={styles.cadastros}>
            <nav className={styles.secoes} aria-label="Cadastros auxiliares">
                {SECOES.map((secao) => (
                    <button
                        key={secao.id}
                        type="button"
                        className={styles.secao}
                        data-ativa={secao.id === secaoAtiva}
                        aria-pressed={secao.id === secaoAtiva}
                        onClick={() => setSecaoAtiva(secao.id)}
                    >
                        {secao.rotulo}
                    </button>
                ))}
            </nav>

            <Componente />
        </div>
    );
}

export default CadastrosAdmin;
