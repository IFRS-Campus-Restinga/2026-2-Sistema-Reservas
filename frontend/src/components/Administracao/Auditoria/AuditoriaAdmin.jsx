import { useEffect, useState } from 'react';
import styles from './AuditoriaAdmin.module.css';

import { buscarLogsAuditoria } from '../../../services';
import useDebounce from '../../../hooks/useDebounce';
import { extrairMensagemErro } from '../../Grupos/gruposUtils';
import {
    ACAO_AUDITORIA_LABEL,
    ENTIDADE_AUDITORIA_LABEL,
    formatarDataHoraAuditoria,
    rotuloAcaoAuditoria,
} from '../../../utils/auditoria';

import Select from '../../Select/Select';
import TabelaAdministracao from '../TabelaAdmin/TabelaAdmin';
import Paginacao from '../Paginacao/Paginacao';
import ModalDetalheAuditoria from './ModalDetalheAuditoria/ModalDetalheAuditoria';

const ITENS_POR_PAGINA = 20;

const FILTROS_INICIAIS = {
    admin: '',
    usuario_afetado: '',
    acao: '',
    entidade: '',
    data_inicio: '',
    data_fim: '',
};

const paraOpcoes = (rotulos) =>
    Object.entries(rotulos).map(([valor, rotulo]) => ({ valor, rotulo }));

function AuditoriaAdmin() {
    const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
    const [pagina, setPagina] = useState(1);
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [logSelecionado, setLogSelecionado] = useState(null);

    const filtrosAplicados = useDebounce(filtros);

    useEffect(() => {
        let ativo = true;

        buscarLogsAuditoria(filtrosAplicados, pagina)
            .then((dados) => {
                if (!ativo) return;
                setLogs(dados.results);
                setTotal(dados.count);
                setErro('');
            })
            .catch((erro) => {
                if (!ativo) return;
                setLogs([]);
                setTotal(0);
                setErro(extrairMensagemErro(erro, 'Não foi possível carregar os registros de auditoria.'));
            })
            .finally(() => {
                if (ativo) setCarregando(false);
            });

        return () => {
            ativo = false;
        };
    }, [filtrosAplicados, pagina]);

    function alterarFiltro(campo, valor) {
        setFiltros((anteriores) => ({ ...anteriores, [campo]: valor }));
        mudarPagina(1);
    }

    function limparFiltros() {
        setFiltros({ ...FILTROS_INICIAIS });
        mudarPagina(1);
    }

    function mudarPagina(novaPagina) {
        setCarregando(true);
        setPagina(novaPagina);
    }

    const totalPaginas = Math.ceil(total / ITENS_POR_PAGINA);

    const colunas = [
        {
            chave: 'data',
            titulo: 'Data e hora',
            renderizar: (log) => formatarDataHoraAuditoria(log.data),
        },
        {
            chave: 'admin',
            titulo: 'Admin',
            renderizar: (log) => log.admin_nome || log.admin_email,
        },
        {
            chave: 'acao',
            titulo: 'Ação',
            renderizar: (log) => (
                <span className={styles.acao} data-acao={log.acao}>
                    {rotuloAcaoAuditoria(log)}
                </span>
            ),
        },
        {
            chave: 'entidade',
            titulo: 'Entidade',
            campo: 'entidade_descricao',
        },
        {
            chave: 'objeto',
            titulo: 'Objeto',
            renderizar: (log) => <span className={styles.objeto}>{log.descricao}</span>,
        },
        {
            chave: 'afetado',
            titulo: 'Usuário afetado',
            renderizar: (log) => log.usuario_afetado_nome || log.usuario_afetado_email || '-',
        },
        {
            chave: 'detalhes',
            titulo: '',
            renderizar: (log) => (
                <button
                    type="button"
                    className={styles.verDetalhes}
                    onClick={() => setLogSelecionado(log)}
                >
                    Ver detalhes
                </button>
            ),
        },
    ];

    return (
        <div className={styles.auditoria}>
            <div className={styles.cabecalho}>
                <div>
                    <h2 className={styles.titulo}>Registros de auditoria</h2>
                    <p className={styles.subtitulo}>
                        Ações feitas por administradores em reservas, grupos e cadastros.
                    </p>
                </div>
                {!carregando && (
                    <span className={styles.total}>
                        {total} {total === 1 ? 'registro encontrado' : 'registros encontrados'}
                    </span>
                )}
            </div>

            <div className={styles.filtros}>
                <label className={styles.campo}>
                    Admin
                    <input
                        type="search"
                        className={styles.input}
                        value={filtros.admin}
                        onChange={(evento) => alterarFiltro('admin', evento.target.value)}
                        placeholder="Nome ou e-mail"
                    />
                </label>

                <label className={styles.campo}>
                    Usuário afetado
                    <input
                        type="search"
                        className={styles.input}
                        value={filtros.usuario_afetado}
                        onChange={(evento) => alterarFiltro('usuario_afetado', evento.target.value)}
                        placeholder="Nome ou e-mail"
                    />
                </label>

                <label className={styles.campo}>
                    Ação
                    <Select
                        valor={filtros.acao}
                        aoAlterar={(valor) => alterarFiltro('acao', valor)}
                        opcoes={paraOpcoes(ACAO_AUDITORIA_LABEL)}
                        valorTodos=""
                        rotuloTodos="Todas as ações"
                        ariaLabel="Filtrar por ação"
                    />
                </label>

                <label className={styles.campo}>
                    Entidade
                    <Select
                        valor={filtros.entidade}
                        aoAlterar={(valor) => alterarFiltro('entidade', valor)}
                        opcoes={paraOpcoes(ENTIDADE_AUDITORIA_LABEL)}
                        valorTodos=""
                        rotuloTodos="Todas as entidades"
                        ariaLabel="Filtrar por entidade"
                    />
                </label>

                <label className={styles.campo}>
                    De
                    <input
                        type="date"
                        className={styles.input}
                        value={filtros.data_inicio}
                        onChange={(evento) => alterarFiltro('data_inicio', evento.target.value)}
                    />
                </label>

                <label className={styles.campo}>
                    Até
                    <input
                        type="date"
                        className={styles.input}
                        value={filtros.data_fim}
                        onChange={(evento) => alterarFiltro('data_fim', evento.target.value)}
                    />
                </label>

                <button type="button" className={styles.limpar} onClick={limparFiltros}>
                    Limpar filtros
                </button>
            </div>

            {erro && (
                <p className={styles.erro} role="alert">{erro}</p>
            )}

            {carregando ? (
                <p className={styles.carregando} role="status">Carregando registros...</p>
            ) : (
                <TabelaAdministracao
                    colunas={colunas}
                    dados={logs}
                    mensagemVazia="Nenhum registro de auditoria encontrado."
                />
            )}

            <Paginacao
                paginaAtual={pagina}
                totalPaginas={totalPaginas}
                aoMudarPagina={mudarPagina}
            />

            {logSelecionado && (
                <ModalDetalheAuditoria
                    key={logSelecionado.id}
                    log={logSelecionado}
                    aoFechar={() => setLogSelecionado(null)}
                />
            )}
        </div>
    );
}

export default AuditoriaAdmin;
