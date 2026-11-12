import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import useListaPaginada from '../../../../hooks/useListaPaginada';
import Paginacao from '../../Paginacao/Paginacao';
import TabelaAdministracao from '../../TabelaAdmin/TabelaAdmin';
import ModalConfirmacao from '../../ModalConfirmacao/ModalConfirmacao';
import CampoBusca from '../../CampoBusca/CampoBusca';
import BarraFiltros from '../../../BarraFiltros/BarraFiltros';
import AlertBanner from '../../../AlertBanner/AlertBanner';
import { mensagemDeErro } from '../../../../utils/erros';
import ModalCadastro from './ModalCadastro';
import styles from './CadastroSimples.module.css';

/**
 * Tela de CRUD para cadastros pequenos (uma tabela + modal de formulário).
 *
 * Props:
 * - url: endpoint de listagem/cadastro (ex.: '/api/tipos-recurso/')
 * - titulo: nome no singular, usado no modal (ex.: 'tipo de recurso')
 * - campos: campos do formulário — { nome, rotulo, tipo: 'texto' | 'select' | 'remoto', opcoes, url, obrigatorio, maxLength, placeholder }
 * - colunas: colunas da tabela (mesmo formato do TabelaAdmin, sem a coluna de ações)
 * - servico: { criar(dados), atualizar(id, dados), excluir(id) }
 * - descreverItem: (item) => texto usado na confirmação de exclusão
 * - placeholderBusca: texto do campo de busca
 */
function CadastroSimples({ url, titulo, campos, colunas, servico, descreverItem, placeholderBusca }) {
    const [editando, setEditando] = useState(null);
    const [modalAberto, setModalAberto] = useState(false);
    const [chaveModal, setChaveModal] = useState(0);
    const [excluindo, setExcluindo] = useState(null);
    const [aviso, setAviso] = useState(null);
    const [busca, setBusca] = useState('');

    const { itens, carregando, erro, recarregar, paginacao } = useListaPaginada(url, { busca });

    function abrirModal(item) {
        setEditando(item);
        // A chave nova recria o formulário, já preenchido com os dados do item.
        setChaveModal((valor) => valor + 1);
        setModalAberto(true);
    }

    function fecharModal() {
        setModalAberto(false);
        setEditando(null);
    }

    async function salvar(dados) {
        if (editando) {
            await servico.atualizar(editando.id, dados);
        } else {
            await servico.criar(dados);
        }
        const editou = Boolean(editando);
        fecharModal();
        setAviso({ tipo: 'sucesso', mensagem: editou ? 'Cadastro atualizado com sucesso.' : 'Cadastro realizado com sucesso.' });
        recarregar();
    }

    async function confirmarExclusao() {
        if (!excluindo) return;
        try {
            await servico.excluir(excluindo.id);
            setExcluindo(null);
            setAviso({ tipo: 'sucesso', mensagem: 'Cadastro excluído com sucesso.' });
            recarregar();
        } catch (falha) {
            setExcluindo(null);
            setAviso({ tipo: 'erro', mensagem: mensagemDeErro(falha, 'Não foi possível excluir o cadastro.') });
        }
    }

    const colunasComAcoes = [
        ...colunas,
        {
            chave: 'acao',
            titulo: 'Ação',
            renderizar: (item) => (
                <div className={styles.acoes}>
                    <button type="button" className={styles.editar} onClick={() => abrirModal(item)}
                        title="Editar" aria-label={`Editar ${descreverItem(item)}`}>
                        <Pencil size={13} />
                    </button>
                    <button type="button" className={styles.excluir} onClick={() => setExcluindo(item)}
                        title="Excluir" aria-label={`Excluir ${descreverItem(item)}`}>
                        <Trash2 size={13} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className={styles.cadastro}>
            <BarraFiltros
                acoes={(
                    <button type="button" className={styles.adicionar} onClick={() => abrirModal(null)}>
                        <Plus size={16} />
                        Adicionar
                    </button>
                )}
            >
                <CampoBusca valor={busca} aoAlterar={setBusca} placeholder={placeholderBusca} />
            </BarraFiltros>

            <AlertBanner tipo={aviso?.tipo} mensagem={aviso?.mensagem} aoFechar={() => setAviso(null)} />
            <AlertBanner tipo="erro" mensagem={erro} />

            {carregando ? (
                <p className={styles.carregando} role="status">Carregando...</p>
            ) : (
                <TabelaAdministracao
                    colunas={colunasComAcoes}
                    dados={itens}
                    mensagemVazia={busca.trim() ? 'Nenhum cadastro encontrado para esta busca.' : 'Nenhum cadastro realizado.'}
                />
            )}

            <Paginacao {...paginacao} />

            {modalAberto && (
                <ModalCadastro
                    key={chaveModal}
                    titulo={editando ? `Editar ${titulo}` : `Adicionar ${titulo}`}
                    campos={campos}
                    item={editando}
                    aoFechar={fecharModal}
                    aoSalvar={salvar}
                />
            )}

            <ModalConfirmacao
                aberto={Boolean(excluindo)}
                titulo={`Excluir ${titulo}?`}
                mensagem={excluindo ? `Tem certeza que deseja excluir "${descreverItem(excluindo)}"?` : ''}
                aoCancelar={() => setExcluindo(null)}
                aoConfirmar={confirmarExclusao}
            />
        </div>
    );
}

export default CadastroSimples;
