import { useEffect, useState } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import styles from './RecursosAdmin.module.css';

import {
    atualizarRecursoGeral,
    criarRecursoGeral,
    excluirRecursoGeral,
    listarRecursosGerais,
    listarTiposRecurso,
} from '../../../services';

import CampoBusca from '../CampoBusca/CampoBusca';
import ModalConfirmacao from '../ModalConfirmacao/ModalConfirmacao';
import TabelaAdministracao from '../TabelaAdmin/TabelaAdmin';
import RecursoModal from './ModalRecurso/RecursoModal';

function RecursosAdmin() {
    const [recursos, setRecursos] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [busca, setBusca] = useState('');
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const [modalRecursoAberto, setModalRecursoAberto] = useState(false);
    const [recursoEditando, setRecursoEditando] = useState(null);
    const [recursoExcluindo, setRecursoExcluindo] = useState(null);

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        try {
            setCarregando(true);
            setErro('');

            const [listaRecursos, listaTipos] = await Promise.all([
                listarRecursosGerais(),
                listarTiposRecurso(),
            ]);

            setRecursos(listaRecursos);
            setTipos(listaTipos);
        } catch (erro) {
            console.error(erro);
            setErro('Não foi possível carregar os recursos.');
        } finally {
            setCarregando(false);
        }
    }

    function abrirCadastro() {
        setRecursoEditando(null);
        setModalRecursoAberto(true);
    }

    function abrirEdicao(recurso) {
        setRecursoEditando(recurso);
        setModalRecursoAberto(true);
    }

    function fecharModalRecurso() {
        setModalRecursoAberto(false);
        setRecursoEditando(null);
    }

    async function salvarRecurso(dados) {
        setErro('');

        if (recursoEditando) {
            await atualizarRecursoGeral(recursoEditando.id, dados);
        } else {
            await criarRecursoGeral({
                ...dados,
                quantidade_reservada: 0,
            });
        }

        fecharModalRecurso();
        await carregarDados();
    }

    function solicitarExclusao(recurso) {
        setRecursoExcluindo(recurso);
    }

    async function confirmarExclusao() {
        if (!recursoExcluindo) {
            return;
        }

        try {
            setErro('');
            await excluirRecursoGeral(recursoExcluindo.id);
            setRecursoExcluindo(null);
            await carregarDados();
        } catch (erro) {
            console.error(erro);
            setErro('Não foi possível excluir o recurso.');
        }
    }

    function mostrarStatus(status) {
        switch (status) {
            case 'ATIVO':
                return 'Ativo';
            case 'MANUTENCAO':
                return 'Manutenção';
            case 'INATIVO':
                return 'Inativo';
            default:
                return status;
        }
    }

    const tiposPorId = {};
    tipos.forEach((tipo) => {
        tiposPorId[tipo.id] = tipo.descricao;
    });

    const termoBusca = busca.trim().toLowerCase();
    const recursosFiltrados = recursos.filter((recurso) => {
        const tipo = tiposPorId[recurso.tipo_recurso] || '';
        const codigo = recurso.codigo || '';

        return (
            recurso.nome.toLowerCase().includes(termoBusca) ||
            tipo.toLowerCase().includes(termoBusca) ||
            codigo.toLowerCase().includes(termoBusca)
        );
    });

    const colunas = [
        {
            chave: 'nome',
            titulo: 'Recurso',
            campo: 'nome',
        },
        {
            chave: 'tipo_recurso',
            titulo: 'Categoria',
            renderizar: (recurso) => tiposPorId[recurso.tipo_recurso] || '-',
        },
        {
            chave: 'disponibilidade',
            titulo: 'Disponibilidade',
            renderizar: (recurso) => {
                const disponiveis = Math.max(
                    0,
                    recurso.quantidade_total - recurso.quantidade_reservada,
                );

                return `${disponiveis}/${recurso.quantidade_total}`;
            },
        },
        {
            chave: 'status',
            titulo: 'Status',
            renderizar: (recurso) => (
                <span className={styles.status} data-status={recurso.status}>
                    {recurso.status === 'ATIVO'
                        ? <ToggleRight size={13} aria-hidden="true" />
                        : <ToggleLeft size={13} aria-hidden="true" />}
                    {mostrarStatus(recurso.status)}
                </span>
            ),
        },
        {
            chave: 'acao',
            titulo: 'Ação',
            renderizar: (recurso) => (
                <div className={styles.acoes}>
                    <button
                        type="button"
                        className={styles.editar}
                        onClick={() => abrirEdicao(recurso)}
                        title="Editar"
                        aria-label={`Editar ${recurso.nome}`}
                    >
                        <Pencil size={13} />
                    </button>

                    <button
                        type="button"
                        className={styles.excluir}
                        onClick={() => solicitarExclusao(recurso)}
                        title="Excluir"
                        aria-label={`Excluir ${recurso.nome}`}
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className={styles.recursos}>
            <div className={styles.barraAcoes}>
                <CampoBusca
                    valor={busca}
                    aoAlterar={setBusca}
                    placeholder="Buscar por nome, categoria ou código..."
                />

                <button
                    type="button"
                    className={styles.adicionar}
                    onClick={abrirCadastro}
                    disabled={tipos.length === 0}
                    title={tipos.length === 0 ? 'Cadastre um tipo de recurso primeiro' : undefined}
                >
                    <Plus size={16} />
                    Adicionar
                </button>
            </div>

            {erro && (
                <p className={styles.erro} role="alert">{erro}</p>
            )}

            {carregando ? (
                <p className={styles.carregando} role="status">Carregando recursos...</p>
            ) : (
                <TabelaAdministracao
                    colunas={colunas}
                    dados={recursosFiltrados}
                    mensagemVazia={termoBusca
                        ? 'Nenhum recurso encontrado para esta busca.'
                        : 'Nenhum recurso cadastrado.'}
                />
            )}

            <RecursoModal
                aberto={modalRecursoAberto}
                recurso={recursoEditando}
                tipos={tipos}
                aoFechar={fecharModalRecurso}
                aoSalvar={salvarRecurso}
            />

            <ModalConfirmacao
                aberto={Boolean(recursoExcluindo)}
                titulo="Excluir recurso?"
                mensagem={
                    recursoExcluindo
                        ? `Tem certeza que deseja excluir ${recursoExcluindo.nome}?`
                        : ''
                }
                aoCancelar={() => setRecursoExcluindo(null)}
                aoConfirmar={confirmarExclusao}
            />
        </div>
    );
}

export default RecursosAdmin;
