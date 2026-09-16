import { useEffect, useState } from 'react';
import { Pencil, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import styles from './VeiculosAdmin.module.css';

import {
    buscarVeiculos,
    criarVeiculo,
    atualizarVeiculo,
    excluirVeiculo,
} from '../../../services';

import TabelaAdministracao from '../TabelaAdmin/TabelaAdmin';
import VeiculoModal from './ModalVeiculo/VeiculoModal';
import ModalConfirmacao from '../ModalConfirmacao/ModalConfirmacao';


function VeiculosAdministracao() {
    const [veiculos, setVeiculos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const [modalVeiculoAberto, setModalVeiculoAberto] =  useState(false);
    const [veiculoEditando, setVeiculoEditando] =useState(null);
    const [veiculoExcluindo, setVeiculoExcluindo] = useState(null);

    useEffect(() => {
        carregarVeiculos();
    }, []);

    async function carregarVeiculos() {
        try {
            setCarregando(true);
            setErro('');

            const dados = await buscarVeiculos();

            setVeiculos(dados);
        } catch (erro) {
            console.error(erro);
            setErro('Não foi possível carregar os veículos.');
        } finally {
            setCarregando(false);
        }
    }

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
                    {mostrarStatus(veiculo.status)}
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
            <div className={styles.barraAcoes}>
                <button
                    type="button"
                    className={styles.adicionar}
                    onClick={abrirCadastro}
                >
                    <Plus size={16} />
                    Adicionar
                </button>
            </div>

            {erro && (
                <p className={styles.erro} role="alert">{erro}</p>
            )}

            {carregando ? (
                <p className={styles.carregando} role="status">Carregando veículos...</p>
            ) : (
                <TabelaAdministracao
                    colunas={colunas}
                    dados={veiculos}
                    mensagemVazia="Nenhum veículo cadastrado."
                />
            )}

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
