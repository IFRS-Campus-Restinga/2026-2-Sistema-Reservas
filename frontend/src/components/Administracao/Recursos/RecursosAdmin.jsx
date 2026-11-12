import useListaPaginada from '../../../hooks/useListaPaginada';
import Paginacao from '../Paginacao/Paginacao';
import { useState } from 'react';
import { Pencil, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import styles from './RecursosAdmin.module.css';

import { atualizarRecursoGeral, criarRecursoGeral, excluirRecursoGeral } from '../../../services';

import CampoBusca from '../CampoBusca/CampoBusca';
import BarraFiltros from '../../BarraFiltros/BarraFiltros';
import ModalConfirmacao from '../ModalConfirmacao/ModalConfirmacao';
import TabelaAdministracao from '../TabelaAdmin/TabelaAdmin';
import RecursoModal from './ModalRecurso/RecursoModal';
import Select from '../../Select/Select';
import SelectRemoto from '../../SelectRemoto/SelectRemoto';
import { OPCOES_STATUS_RECURSO, STATUS_RECURSO_LABEL } from '../../../utils/statusRecurso';
import AlertBanner from '../../AlertBanner/AlertBanner';
import Tooltip from '../../Tooltip/Tooltip';

function RecursosAdmin() {
    const [busca, setBusca] = useState('');
    const [filtroTiposRecurso, setFiltroTiposRecurso] = useState([]);
    const [filtroStatus, setFiltroStatus] = useState('todos');

    const [modalRecursoAberto, setModalRecursoAberto] = useState(false);
    const [recursoEditando, setRecursoEditando] = useState(null);
    const [recursoExcluindo, setRecursoExcluindo] = useState(null);
    const [aviso, setAviso] = useState(null);


    const { itens: recursos, carregando, erro, setErro, recarregar: carregarDados, paginacao } = useListaPaginada('/api/recursos-gerais/', {
        busca,
        tipo_recurso: filtroTiposRecurso.join(','),
        status: filtroStatus,
    });
    const filtrando = Boolean(busca.trim()) || filtroTiposRecurso.length > 0 || filtroStatus !== 'todos';

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
        setAviso({ tipo: 'sucesso', mensagem: recursoEditando ? 'Recurso atualizado com sucesso.' : 'Recurso cadastrado com sucesso.' });
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
            setAviso({ tipo: 'sucesso', mensagem: 'Recurso excluído com sucesso.' });
        } catch (erro) {
            console.error(erro);
            setAviso({ tipo: 'erro', mensagem: 'Não foi possível excluir o recurso.' });
        }
    }

    const colunas = [
        {
            chave: 'nome',
            titulo: 'Recurso',
            campo: 'nome',
        },
        {
            chave: 'tipo_recurso',
            titulo: 'Tipo de recurso',
            renderizar: (recurso) => recurso.tipo_descricao || '-',
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
                    {STATUS_RECURSO_LABEL[recurso.status] || recurso.status}
                </span>
            ),
        },
        {
            chave: 'acao',
            titulo: 'Ação',
            renderizar: (recurso) => (
                <div className={styles.acoes}>
                    <Tooltip texto="Editar recurso">
                        <button
                            type="button"
                            className={styles.editar}
                            onClick={() => abrirEdicao(recurso)}
                            aria-label={`Editar ${recurso.nome}`}
                        >
                            <Pencil size={13} />
                        </button>
                    </Tooltip>

                    <Tooltip texto="Excluir recurso">
                        <button
                            type="button"
                            className={styles.excluir}
                            onClick={() => solicitarExclusao(recurso)}
                            aria-label={`Excluir ${recurso.nome}`}
                        >
                            <Trash2 size={13} />
                        </button>
                    </Tooltip>
                </div>
            ),
        },
    ];

    return (
        <div className={styles.recursos}>
            <BarraFiltros
                acoes={(
                    <button
                        type="button"
                        className={styles.adicionar}
                        onClick={abrirCadastro}
                    >
                        <Plus size={16} />
                        Adicionar
                    </button>
                )}
            >
                <CampoBusca
                    valor={busca}
                    aoAlterar={setBusca}
                    placeholder="Buscar por nome, tipo de recurso ou código..."
                />
                <SelectRemoto
                    url="/api/tipos-recurso/"
                    valor={filtroTiposRecurso}
                    aoAlterar={setFiltroTiposRecurso}
                    rotuloTodos="Todos os tipos de recurso"
                    ariaLabel="Filtrar recursos por tipo de recurso"
                    placeholderBusca="Buscar tipo..."
                    multiplo
                />
                <Select
                    valor={filtroStatus}
                    aoAlterar={setFiltroStatus}
                    opcoes={OPCOES_STATUS_RECURSO}
                    valorTodos="todos"
                    rotuloTodos="Todos os status"
                    ariaLabel="Filtrar recursos por status"
                />
            </BarraFiltros>

            <AlertBanner tipo={aviso?.tipo} mensagem={aviso?.mensagem} aoFechar={() => setAviso(null)} />

            <AlertBanner tipo="erro" mensagem={erro} />

            <TabelaAdministracao
                carregando={carregando}
                rotuloCarregando="Carregando recursos..."
                colunas={colunas}
                dados={recursos}
                mensagemVazia={filtrando
                    ? 'Nenhum recurso encontrado para os filtros aplicados.'
                    : 'Nenhum recurso cadastrado.'}
            />

            <Paginacao {...paginacao} />

            <RecursoModal
                aberto={modalRecursoAberto}
                recurso={recursoEditando}
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
