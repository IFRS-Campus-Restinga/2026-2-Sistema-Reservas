import { useEffect, useEffectEvent, useState } from 'react';
import { Search, X } from 'lucide-react';
import { buscarCandidatos } from '../../../services';
import useDebounce from '../../../hooks/useDebounce';
import styles from './BuscaUsuario.module.css';

const LIMITE_RESULTADOS = 10;

function BuscaUsuario({ grupoId, idsSelecionados, idsMembros, aoSelecionar, placeholder = 'Nome ou e-mail...' }) {
    const [termo, setTermo] = useState('');
    const [resultado, setResultado] = useState({ consulta: null, dados: null });
    const termoBuscado = useDebounce(termo.trim());
    const aberto = termo.trim().length >= 2 && termoBuscado.length >= 2;
    const carregando = resultado.consulta !== termoBuscado;
    const dados = resultado.dados;

    // Lê os selecionados do momento sem refazer a busca a cada seleção; eles são escondidos pelo filtro abaixo.
    const lerIdsSelecionados = useEffectEvent(() => idsSelecionados);

    useEffect(() => {
        if (termoBuscado.length < 2) {
            return;
        }
        let cancelado = false;
        buscarCandidatos(grupoId, { limite: LIMITE_RESULTADOS, busca: termoBuscado, excluir: lerIdsSelecionados() })
            .then((dados) => !cancelado && setResultado({ consulta: termoBuscado, dados }))
            .catch(() => !cancelado && setResultado({ consulta: termoBuscado, dados: null }));
        return () => {
            cancelado = true;
        };
    }, [grupoId, termoBuscado]);

    const idsIgnorados = [...idsSelecionados, ...idsMembros];
    const disponiveis = (dados?.resultados ?? []).filter((usuario) => !idsIgnorados.includes(usuario.id));

    return (
        <div className={styles.container}>
            <div className={styles.campo}>
                <Search size={14} className={styles.icone} aria-hidden="true" />
                <input
                    type="text"
                    className={styles.input}
                    value={termo}
                    onChange={(evento) => setTermo(evento.target.value)}
                    placeholder={placeholder}
                    aria-label={placeholder}
                />
                {termo && (
                    <button
                        type="button"
                        className={styles.limpar}
                        onClick={() => setTermo('')}
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

                    {!carregando && dados?.tem_mais && (
                        <p className={styles.dica}>
                            Mostrando os primeiros {LIMITE_RESULTADOS} resultados. Refine a busca para encontrar outros usuários.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default BuscaUsuario;
