import useListaPaginada from '../../../hooks/useListaPaginada';
import Paginacao from '../Paginacao/Paginacao';
import { useState } from 'react';
import { Pencil, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import styles from './BlocosAdmin.module.css';

import { criarBloco, atualizarBloco, excluirBloco } from '../../../services';

import TabelaAdministracao from '../TabelaAdmin/TabelaAdmin';
import BlocoModal from './ModalBloco/BlocoModal';
import ModalConfirmacao from '../ModalConfirmacao/ModalConfirmacao';
import CampoBusca from '../CampoBusca/CampoBusca';
import BarraFiltros from '../../BarraFiltros/BarraFiltros';
import { ACESSIBILIDADE_LABELS } from '../../../utils/acessibilidadeBloco';
import AlertBanner from '../../AlertBanner/AlertBanner';

function BlocosAdministracao() {

    const [modalBlocoAberto, setModalBlocoAberto] = useState(false);
    const [blocoEditando, setBlocoEditando] = useState(null);
    const [blocoExcluindo, setBlocoExcluindo] = useState(null);
    const [aviso, setAviso] = useState(null);
    const [busca, setBusca] = useState('');

    const { itens: blocos, carregando, erro, setErro, recarregar: carregarBlocos, paginacao } = useListaPaginada('/api/blocos/', { busca });

    function abrirCadastro() {
        setBlocoEditando(null);
        setModalBlocoAberto(true);
    }

    function abrirEdicao(bloco) {
        setBlocoEditando(bloco);
        setModalBlocoAberto(true);
    }

    function fecharModalBloco() {
        setModalBlocoAberto(false);
        setBlocoEditando(null);
    }

    async function salvarBloco(dados) {
        setErro('');

        if (blocoEditando) {
            await atualizarBloco(blocoEditando.id, dados);
        } else {
            await criarBloco(dados);
        }
        fecharModalBloco();
        setAviso({ tipo: 'sucesso', mensagem: blocoEditando ? 'Bloco atualizado com sucesso.' : 'Bloco cadastrado com sucesso.' });

        await carregarBlocos();
    }

    function solicitarExclusao(bloco) {
        setBlocoExcluindo(bloco);
    }

    async function confirmarExclusao() {
        if (!blocoExcluindo) {
            return;
        }
        try {
            setErro('');

            await excluirBloco(blocoExcluindo.id);

            setBlocoExcluindo(null);

            await carregarBlocos();
            setAviso({ tipo: 'sucesso', mensagem: 'Bloco excluído com sucesso.' });
        } catch (erro) {
            console.error(erro);
            setAviso({ tipo: 'erro', mensagem: 'Não foi possível excluir o bloco.' });
        }
    }

    const colunas = [
        {
            chave: 'numero',
            titulo: 'Número',
            campo: 'numero',
        },
        {
            chave: 'nome',
            titulo: 'Nome',
            campo: 'nome',
        },
        {
            chave: 'banheiro',
            titulo: 'Banheiro',
            renderizar: (bloco) => (
                <span className={styles.status} data-status={bloco.banheiro ? 'SIM' : 'NAO'}>
                    {bloco.banheiro
                        ? <CheckCircle size={13} aria-hidden="true" />
                        : <XCircle size={13} aria-hidden="true" />}
                    {bloco.banheiro ? 'Sim' : 'Não'}
                </span>
            ),
        },
        {
            chave: 'acessibilidade',
            titulo: 'Acessibilidade',
            renderizar: (bloco) => {
                if (!bloco.acessibilidade || bloco.acessibilidade.length === 0) {
                    return 'Nenhuma';
                }
                return bloco.acessibilidade
                    .map((item) => ACESSIBILIDADE_LABELS[item] || item)
                    .join(', ');
            }
        },
        {
            chave: 'acao',
            titulo: 'Ação',
            renderizar: (bloco) => (
                <div className={styles.acoes}>
                    <button
                        type="button"
                        className={styles.editar}
                        onClick={() => abrirEdicao(bloco)}
                        title="Editar"
                        aria-label={`Editar bloco ${bloco.numero}`}
                    >
                        <Pencil size={13} />
                    </button>

                    <button
                        type="button"
                        className={styles.excluir}
                        onClick={() => solicitarExclusao(bloco)}
                        title="Excluir"
                        aria-label={`Excluir bloco ${bloco.numero}`}
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className={styles.blocos}>
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
                    placeholder="Buscar bloco por nome ou número..."
                />
            </BarraFiltros>

            <AlertBanner tipo={aviso?.tipo} mensagem={aviso?.mensagem} aoFechar={() => setAviso(null)} />

            <AlertBanner tipo="erro" mensagem={erro} />

            {carregando ? (
                <p className={styles.carregando} role="status">Carregando blocos...</p>
            ) : (
                <TabelaAdministracao
                    colunas={colunas}
                    dados={blocos}
                    mensagemVazia={busca.trim()
                        ? 'Nenhum bloco encontrado para esta busca.'
                        : 'Nenhum bloco cadastrado.'}
                />
            )}

            <Paginacao {...paginacao} />

            <BlocoModal
                aberto={modalBlocoAberto}
                bloco={blocoEditando}
                aoFechar={fecharModalBloco}
                aoSalvar={salvarBloco}
            />

            <ModalConfirmacao
                aberto={Boolean(blocoExcluindo)}
                titulo="Excluir bloco?"
                mensagem={
                    blocoExcluindo
                        ? `Tem certeza que deseja excluir o bloco ${blocoExcluindo.numero} - ${blocoExcluindo.nome}?`
                        : ''
                }
                aoCancelar={() => setBlocoExcluindo(null)}
                aoConfirmar={confirmarExclusao}
            />
        </div>
    );
}

export default BlocosAdministracao;
