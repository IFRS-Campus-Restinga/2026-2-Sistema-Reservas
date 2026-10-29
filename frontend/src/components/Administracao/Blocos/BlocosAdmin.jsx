import useListaPaginada from '../../../hooks/useListaPaginada';
import Paginacao from '../Paginacao/Paginacao';
import { useState } from 'react';
import { Pencil, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import styles from './BlocosAdmin.module.css';

import { criarBloco, atualizarBloco, excluirBloco } from '../../../services';

import TabelaAdministracao from '../TabelaAdmin/TabelaAdmin';
import BlocoModal from './ModalBloco/BlocoModal';
import ModalConfirmacao from '../ModalConfirmacao/ModalConfirmacao';

function BlocosAdministracao() {

    const [modalBlocoAberto, setModalBlocoAberto] = useState(false);
    const [blocoEditando, setBlocoEditando] = useState(null);
    const [blocoExcluindo, setBlocoExcluindo] = useState(null);


    const { itens: blocos, carregando, erro, setErro, recarregar: carregarBlocos, paginacao } = useListaPaginada('/api/blocos/', {});

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
        } catch (erro) {
            console.error(erro);
            setErro('Não foi possível excluir o bloco.');
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
                const itens = bloco.acessibilidade.map(item => {
                    if (item === 'PISO_TATIL') return 'Piso Tátil';
                    if (item === 'BANHEIRO') return 'Banheiro Adaptado';
                    if (item === 'BEBEDOURO') return 'Bebedouro Adaptado';
                    return item;
                });
                return itens.join(', ');
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
                <p className={styles.carregando} role="status">Carregando blocos...</p>
            ) : (
                <TabelaAdministracao
                    colunas={colunas}
                    dados={blocos}
                    mensagemVazia="Nenhum bloco cadastrado."
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
