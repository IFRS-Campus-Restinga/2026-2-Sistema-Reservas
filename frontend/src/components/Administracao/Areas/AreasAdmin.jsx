import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, ToggleLeft, ToggleRight, CheckCircle, XCircle } from 'lucide-react';
import styles from './AreasAdmin.module.css';

import {
    buscarAreas,
    criarArea,
    atualizarArea,
    excluirArea,
    buscarBlocos,
} from '../../../services';

import TabelaAdministracao from '../TabelaAdmin/TabelaAdmin';
import AreaModal from './ModalArea/AreaModal';
import ModalConfirmacao from '../ModalConfirmacao/ModalConfirmacao';

function AreasAdministracao() {
    const [areas, setAreas] = useState([]);
    const [blocos, setBlocos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const [modalAreaAberto, setModalAreaAberto] = useState(false);
    const [areaEditando, setAreaEditando] = useState(null);
    const [areaExcluindo, setAreaExcluindo] = useState(null);

    useEffect(() => {
        carregarDados();
    }, []);

    async function carregarDados() {
        try {
            setCarregando(true);
            setErro('');

            const [dadosAreas, dadosBlocos] = await Promise.all([
                buscarAreas(),
                buscarBlocos()
            ]);

            setAreas(dadosAreas);
            setBlocos(dadosBlocos);
        } catch (erro) {
            console.error(erro);
            setErro('Não foi possível carregar as áreas.');
        } finally {
            setCarregando(false);
        }
    }

    function abrirCadastro() {
        setAreaEditando(null);
        setModalAreaAberto(true);
    }

    function abrirEdicao(area) {
        setAreaEditando(area);
        setModalAreaAberto(true);
    }

    function fecharModalArea() {
        setModalAreaAberto(false);
        setAreaEditando(null);
    }

    async function salvarArea(dados) {
        setErro('');

        if (areaEditando) {
            await atualizarArea(areaEditando.id, dados);
        } else {
            await criarArea(dados);
        }
        fecharModalArea();

        await carregarDados();
    }

    function solicitarExclusao(area) {
        setAreaExcluindo(area);
    }

    async function confirmarExclusao() {
        if (!areaExcluindo) {
            return;
        }
        try {
            setErro('');

            await excluirArea(areaExcluindo.id);

            setAreaExcluindo(null);

            await carregarDados();
        } catch (erro) {
            console.error(erro);
            setErro('Não foi possível excluir a área.');
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
            titulo: 'Nome',
            campo: 'nome',
        },
        {
            chave: 'bloco',
            titulo: 'Bloco',
            renderizar: (area) => {
                // Se a API não popular o objeto bloco completo, procuramos na lista
                if (typeof area.bloco === 'number' || typeof area.bloco === 'string') {
                    const blocoEncontrado = blocos.find(b => b.id == area.bloco);
                    return blocoEncontrado ? blocoEncontrado.nome : area.bloco;
                }
                return area.bloco?.nome || 'N/A';
            }
        },
        {
            chave: 'capacidade',
            titulo: 'Capacidade',
            renderizar: (area) => `${area.capacidade} pessoas`,
        },
        {
            chave: 'tipo',
            titulo: 'Tipo',
            campo: 'tipo',
        },
        {
            chave: 'disponibilidade',
            titulo: 'Disponível',
            renderizar: (area) => (
                <span className={styles.status} data-status={area.disponibilidade ? 'SIM' : 'NAO'}>
                    {area.disponibilidade
                        ? <CheckCircle size={13} aria-hidden="true" />
                        : <XCircle size={13} aria-hidden="true" />}
                    {area.disponibilidade ? 'Sim' : 'Não'}
                </span>
            ),
        },
        {
            chave: 'status',
            titulo: 'Status',
            renderizar: (area) => (
                <span className={styles.status} data-status={area.status}>
                    {area.status === 'ATIVO'
                        ? <ToggleRight size={13} aria-hidden="true" />
                        : <ToggleLeft size={13} aria-hidden="true" />}
                    {mostrarStatus(area.status)}
                </span>
            ),
        },
        {
            chave: 'acao',
            titulo: 'Ação',
            renderizar: (area) => (
                <div className={styles.acoes}>
                    <button
                        type="button"
                        className={styles.editar}
                        onClick={() => abrirEdicao(area)}
                        title="Editar"
                        aria-label={`Editar área ${area.nome}`}
                    >
                        <Pencil size={13} />
                    </button>

                    <button
                        type="button"
                        className={styles.excluir}
                        onClick={() => solicitarExclusao(area)}
                        title="Excluir"
                        aria-label={`Excluir área ${area.nome}`}
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className={styles.areas}>
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
                <p className={styles.carregando} role="status">Carregando áreas...</p>
            ) : (
                <TabelaAdministracao
                    colunas={colunas}
                    dados={areas}
                    mensagemVazia="Nenhuma área cadastrada."
                />
            )}

            <AreaModal
                aberto={modalAreaAberto}
                area={areaEditando}
                blocos={blocos}
                aoFechar={fecharModalArea}
                aoSalvar={salvarArea}
            />

            <ModalConfirmacao
                aberto={Boolean(areaExcluindo)}
                titulo="Excluir área?"
                mensagem={
                    areaExcluindo
                        ? `Tem certeza que deseja excluir a área ${areaExcluindo.nome}?`
                        : ''
                }
                aoCancelar={() => setAreaExcluindo(null)}
                aoConfirmar={confirmarExclusao}
            />
        </div>
    );
}

export default AreasAdministracao;
