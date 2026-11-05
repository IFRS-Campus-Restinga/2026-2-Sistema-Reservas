import useListaPaginada from '../../../hooks/useListaPaginada';
import Paginacao from '../Paginacao/Paginacao';
import { useState } from 'react';
import { Pencil, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import styles from './VeiculosAdmin.module.css';

import { criarVeiculo, atualizarVeiculo, excluirVeiculo } from '../../../services';

import TabelaAdministracao from '../TabelaAdmin/TabelaAdmin';
import VeiculoModal from './ModalVeiculo/VeiculoModal';
import ModalConfirmacao from '../ModalConfirmacao/ModalConfirmacao';
import CampoBusca from '../CampoBusca/CampoBusca';
import BarraFiltros from '../../BarraFiltros/BarraFiltros';
import Select from '../../Select/Select';
import { OPCOES_STATUS_RECURSO, STATUS_RECURSO_LABEL } from '../../../utils/statusRecurso';

function VeiculosAdministracao() {
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('todos');

    const [modalVeiculoAberto, setModalVeiculoAberto] =  useState(false);
    const [veiculoEditando, setVeiculoEditando] =useState(null);
    const [veiculoExcluindo, setVeiculoExcluindo] = useState(null);


    const { itens: veiculos, carregando, erro, setErro, recarregar: carregarVeiculos, paginacao } = useListaPaginada('/api/veiculos/', { busca, status: filtroStatus });
    const filtrando = Boolean(busca.trim()) || filtroStatus !== 'todos';

    function abrirCadastro() {
        setVeiculoEditando(null);
        setModalVeiculoAberto(true);
    }

    function abrirEdicao(veiculo) {
        setVeiculoEditando(veiculo);
        setModalVeiculoAberto(true);
    }

    function fecharModalVeiculo() {
        setModalVeiculoAberto(false);
        setVeiculoEditando(null);
    }

    async function salvarVeiculo(dados) {
        setErro('');

        if (veiculoEditando) {
            await atualizarVeiculo(veiculoEditando.id,dados);
        } else {
            await criarVeiculo(dados);
        }
        fecharModalVeiculo();

        await carregarVeiculos();
    }

    function solicitarExclusao(veiculo) {
        setVeiculoExcluindo(veiculo);
    }

    async function confirmarExclusao() {
        if (!veiculoExcluindo) {
            return;
        }
        try {
            setErro('');

            await excluirVeiculo(
                veiculoExcluindo.id
            );

            setVeiculoExcluindo(null);

            await carregarVeiculos();
        } catch (erro) {
            console.error(erro);
            setErro('Não foi possível excluir o veículo.');
        }
    }

    const colunas = [
        {
            chave: 'nome',
            titulo: 'Veículo',
            campo: 'nome',
        },
        {
            chave: 'placa',
            titulo: 'Placa',
            campo: 'placa',
        },
        {
            chave: 'capacidade',
            titulo: 'Capacidade',
            renderizar: (veiculo) =>
                `${veiculo.capacidade} lugares`,
        },
        {
            chave: 'status',
            titulo: 'Status',
            renderizar: (veiculo) => (
                <span className={styles.status} data-status={veiculo.status}>
                    {veiculo.status === 'ATIVO'
                        ? <ToggleRight size={13} aria-hidden="true" />
                        : <ToggleLeft size={13} aria-hidden="true" />}
                    {STATUS_RECURSO_LABEL[veiculo.status] || veiculo.status}
                </span>
            ),
        },
        {
            chave: 'acao',
            titulo: 'Ação',
            renderizar: (veiculo) => (
                <div className={styles.acoes}>
                    <button
                        type="button"
                        className={styles.editar}
                        onClick={() =>
                            abrirEdicao(veiculo)
                        }
                        title="Editar"
                        aria-label={`Editar ${veiculo.nome}`}
                    >
                        <Pencil size={13} />
                    </button>

                    <button
                        type="button"
                        className={styles.excluir}
                        onClick={() =>
                            solicitarExclusao(veiculo)
                        }
                        title="Excluir"
                        aria-label={`Excluir ${veiculo.nome}`}
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            ),
        },
    ];


    return (
        <div className={styles.veiculos}>
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
                    placeholder="Buscar por nome ou placa..."
                />
                <Select
                    valor={filtroStatus}
                    aoAlterar={setFiltroStatus}
                    opcoes={OPCOES_STATUS_RECURSO}
                    valorTodos="todos"
                    rotuloTodos="Todos os status"
                    ariaLabel="Filtrar veículos por status"
                />
            </BarraFiltros>

            {erro && (
                <p className={styles.erro} role="alert">{erro}</p>
            )}

            {carregando ? (
                <p className={styles.carregando} role="status">Carregando veículos...</p>
            ) : (
                <TabelaAdministracao
                    colunas={colunas}
                    dados={veiculos}
                    mensagemVazia={filtrando
                        ? 'Nenhum veículo encontrado para os filtros aplicados.'
                        : 'Nenhum veículo cadastrado.'}
                />
            )}

            <Paginacao {...paginacao} />

            <VeiculoModal
                aberto={modalVeiculoAberto}
                veiculo={veiculoEditando}
                aoFechar={fecharModalVeiculo}
                aoSalvar={salvarVeiculo}
            />

            <ModalConfirmacao
                aberto={Boolean(veiculoExcluindo)}
                titulo="Excluir veículo?"
                mensagem={
                    veiculoExcluindo
                        ? `Tem certeza que deseja excluir ${veiculoExcluindo.nome}?`
                        : ''
                }
                aoCancelar={() =>
                    setVeiculoExcluindo(null)
                }
                aoConfirmar={confirmarExclusao}
            />
        </div>
    );
}

export default VeiculosAdministracao;
