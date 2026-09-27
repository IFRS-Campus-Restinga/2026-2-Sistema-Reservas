import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Paginacao.module.css';

/**
 * Paginação simples de exibição (client-side), pra usar sobre uma lista
 * que já está toda carregada em memória (ex.: resultado de um filtro).
 *
 * Props:
 * - paginaAtual: número da página atual (1-based)
 * - totalPaginas: número total de páginas
 * - aoMudarPagina: função chamada com o novo número de página
 */
function Paginacao({ paginaAtual, totalPaginas, aoMudarPagina }) {
    if (totalPaginas <= 1) {
        return null;
    }

    return (
        <div className={styles.paginacao}>
            <button
                type="button"
                className={styles.botao}
                onClick={() => aoMudarPagina(paginaAtual - 1)}
                disabled={paginaAtual <= 1}
                aria-label="Página anterior"
            >
                <ChevronLeft size={14} />
                Anterior
            </button>

            <span className={styles.info}>
                Página {paginaAtual} de {totalPaginas}
            </span>

            <button
                type="button"
                className={styles.botao}
                onClick={() => aoMudarPagina(paginaAtual + 1)}
                disabled={paginaAtual >= totalPaginas}
                aria-label="Próxima página"
            >
                Próxima
                <ChevronRight size={14} />
            </button>
        </div>
    );
}

export default Paginacao;
