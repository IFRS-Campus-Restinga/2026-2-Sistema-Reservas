import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { buscarCandidatos } from '../../../services';
import useDebounce from '../../../hooks/useDebounce';
import Paginacao from '../../Administracao/Paginacao/Paginacao';
import styles from './BuscaUsuario.module.css';

const TAMANHO_PAGINA = 10;

function BuscaUsuario({ grupoId, idsIgnorados, aoSelecionar, placeholder = 'Nome ou e-mail...' }) {
    const [termo, setTermo] = useState('');
    const [pagina, setPagina] = useState(1);
    const [resultado, setResultado] = useState({ consulta: null, dados: null });
    const termoBuscado = useDebounce(termo.trim());
    const aberto = termo.trim().length >= 2 && termoBuscado.length >= 2;
    const consulta = `${termoBuscado}|${pagina}`;
    const carregando = resultado.consulta !== consulta;
    const dados = resultado.dados;

    useEffect(() => {
        if (termoBuscado.length < 2) {
            return;
        }
        let cancelado = false;
        buscarCandidatos(grupoId, { pagina, tamanhoPagina: TAMANHO_PAGINA, busca: termoBuscado })
            .then((dados) => !cancelado && setResultado({ consulta, dados }))
            .catch(() => !cancelado && setResultado({ consulta, dados: null }));
        return () => {
            cancelado = true;
        };
    }, [grupoId, termoBuscado, pagina, consulta]);

    const totalPaginas = Math.ceil((dados?.count ?? 0) / TAMANHO_PAGINA);
    const disponiveis = (dados?.results ?? []).filter((usuario) => !idsIgnorados.includes(usuario.id));

    function alterarTermo(valor) {
        setTermo(valor);
        setPagina(1);
    }

    return (
        <div className={styles.container}>
            <div className={styles.campo}>
                <Search size={14} className={styles.icone} aria-hidden="true" />
                <input
                    type="text"
                    className={styles.input}
                    value={termo}
                    onChange={(evento) => alterarTermo(evento.target.value)}
                    placeholder={placeholder}
                    aria-label={placeholder}
                />
                {termo && (
                    <button
                        type="button"
                        className={styles.limpar}
                        onClick={() => alterarTermo('')}
                        aria-label="Limpar busca"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {aberto && (
                <div className={styles.dropdown}>
                    <ul className={styles.lista} role="listbox">
                        {carregando && (
                            <li className={styles.mensagem}>Buscando...</li>
                        )}
                        {!carregando && disponiveis.length === 0 && (
                            <li className={styles.mensagem}>Nenhum usuário encontrado.</li>
                        )}
                        {!carregando && disponiveis.map((usuario) => (
                            <li key={usuario.id}>
                                <button
                                    type="button"
                                    className={styles.opcao}
                                    onClick={() => aoSelecionar(usuario)}
                                >
                                    <span className={styles.nome}>{usuario.nome}</span>
                                    <span className={styles.email}>{usuario.email}</span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    {!carregando && totalPaginas > 1 && (
                        <div className={styles.paginacaoDropdown}>
                            <Paginacao
                                paginaAtual={pagina}
                                totalPaginas={totalPaginas}
                                aoMudarPagina={setPagina}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default BuscaUsuario;
