import useListaPaginada from '../../../hooks/useListaPaginada';
import { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { adicionarMembros, atualizarMembro, removerMembro } from '../../../services';
import Modal from '../../Administracao/Modal/Modal';
import ModalConfirmacao from '../../Administracao/ModalConfirmacao/ModalConfirmacao';
import CampoBusca from '../../Administracao/CampoBusca/CampoBusca';
import TabelaAdministracao from '../../Administracao/TabelaAdmin/TabelaAdmin';
import Paginacao from '../../Administracao/Paginacao/Paginacao';
import BuscaUsuario from '../BuscaUsuario/BuscaUsuario';
import Botao from '../../Botao/Botao';
import { formatarValidadeMembro, extrairMensagemErro } from '../gruposUtils';
import styles from './ModalMembros.module.css';

const TAMANHO_PAGINA = 10;

function ModalMembros({ grupo, aoFechar }) {
    const [busca, setBusca] = useState('');
    const [selecionados, setSelecionados] = useState([]);
    const [validoAte, setValidoAte] = useState('');
    const [adicionando, setAdicionando] = useState(false);
    const [erroAdicionar, setErroAdicionar] = useState('');
    const [confirmandoAdicao, setConfirmandoAdicao] = useState(false);
    const [membroRemovendo, setMembroRemovendo] = useState(null);
    const [processandoId, setProcessandoId] = useState(null);
    const [erroMembro, setErroMembro] = useState('');

    const { itens: membros, total, erro: erroLista, carregando, recarregar, paginacao } = useListaPaginada(`/api/grupos/${grupo.id}/membros/`, { busca, page_size: TAMANHO_PAGINA });
    const membrosDaPagina = membros;
    const alterarBusca = setBusca;

    async function handleAdicionar() {
        setConfirmandoAdicao(false);
        try {
            setAdicionando(true);
            setErroAdicionar('');
            await adicionarMembros(
                grupo.id,
                selecionados.map(({ id }) => ({ usuario: id, data_fim_validade: validoAte || null }))
            );
            recarregar();
            setSelecionados([]);
            setValidoAte('');
        } catch (erro) {
            const errosApi = erro.response?.data;
            if (Array.isArray(errosApi)) {
                setSelecionados((anteriores) => anteriores.map((usuario, indice) => ({
                    ...usuario,
                    erro: Object.values(errosApi[indice] ?? {}).flat().join(' '),
                })));
            } else {
                setErroAdicionar(extrairMensagemErro(erro, 'Não foi possível adicionar os membros.'));
            }
        } finally {
            setAdicionando(false);
        }
    }

    async function alterarMembro(membro, acao, mensagemPadrao) {
        try {
            setProcessandoId(membro.id);
            setErroMembro('');
            await acao();
        } catch (erro) {
            setErroMembro(extrairMensagemErro(erro, mensagemPadrao));
        } finally {
            setProcessandoId(null);
        }
    }

    function handleRemover(membro) {
        setMembroRemovendo(null);
        return alterarMembro(membro, async () => {
            await removerMembro(grupo.id, membro.id);
            recarregar();
        }, 'Não foi possível remover o membro.');
    }

    function handleAlterarValidade(membro, evento) {
        if (!evento.target.validity.valid) {
            return;
        }
        return alterarMembro(membro, async () => {
            await atualizarMembro(grupo.id, membro.id, { data_fim_validade: evento.target.value || null });
            recarregar();
        }, 'Não foi possível atualizar a validade do membro.');
    }

    const colunasMembros = [
        {
            chave: 'membro',
            titulo: 'Membro',
            renderizar: (membro) => (
                <>
                    <p className={styles.nomeMembro}>{membro.usuario_nome}</p>
                    <p className={styles.emailMembro}>{membro.usuario_email}</p>
                </>
            ),
        },
        {
            chave: 'validade',
            titulo: 'Validade',
            renderizar: (membro) => (
                <div className={styles.celulaValidade}>
                    <input
                        type="date"
                        className={styles.inputValidade}
                        defaultValue={membro.data_fim_validade ?? ''}
                        min={grupo.data_inicio_validade}
                        max={grupo.data_fim_validade ?? undefined}
                        onChange={(evento) => handleAlterarValidade(membro, evento)}
                        aria-label={`Data de validade de ${membro.usuario_nome}`}
                    />
                    <span className={styles.dicaValidade}>{formatarValidadeMembro(membro, grupo)}</span>
                </div>
            ),
        },
        {
            chave: 'acao',
            titulo: 'Ação',
            renderizar: (membro) => (
                <button
                    type="button"
                    className={styles.removerMembro}
                    onClick={() => setMembroRemovendo(membro)}
                    disabled={processandoId === membro.id}
                    title="Remover"
                    aria-label={`Remover ${membro.usuario_nome} do grupo`}
                >
                    <X size={14} />
                </button>
            ),
        },
    ];

    return (
        <>
            <Modal
                aberto
                titulo={`Membros de ${grupo.nome}`}
                variante="largo"
                aoFechar={aoFechar}
                rodape={
                    <button type="button" className={styles.fechar} onClick={aoFechar}>
                        Fechar
                    </button>
                }
            >
                <div className={styles.conteudo}>
                    <section className={styles.secao}>
                        <h3 className={styles.tituloSecao}>Adicionar membros</h3>
                        <form className={styles.formAdicionar} onSubmit={(evento) => { evento.preventDefault(); setConfirmandoAdicao(true); }}>
                            <BuscaUsuario
                                grupoId={grupo.id}
                                idsSelecionados={selecionados.map((usuario) => usuario.id)}
                                idsMembros={(membros ?? []).map((membro) => membro.usuario)}
                                aoSelecionar={(usuario) => setSelecionados((anteriores) => [...anteriores, usuario])}
                                placeholder="Buscar usuário para adicionar..."
                            />
                            <input
                                type="date"
                                className={styles.campoData}
                                value={validoAte}
                                onChange={(evento) => setValidoAte(evento.target.value)}
                                title="Vazio usa a validade do grupo"
                                aria-label="Válido até"
                            />
                            <Botao
                                titulo={selecionados.length > 0 ? `Adicionar (${selecionados.length})` : 'Adicionar'}
                                icone={UserPlus}
                                estilo="secundario"
                                tipo="submit"
                                desabilitado={selecionados.length === 0 || adicionando}
                            />
                        </form>

                        {selecionados.length > 0 && (
                            <div className={styles.chips}>
                                {selecionados.map((usuario) => (
                                    <span key={usuario.id} className={styles.chip} data-erro={Boolean(usuario.erro)}>
                                        {usuario.nome}
                                        <button
                                            type="button"
                                            className={styles.removerChip}
                                            onClick={() => setSelecionados((anteriores) => anteriores.filter((u) => u.id !== usuario.id))}
                                            aria-label={`Remover ${usuario.nome} da seleção`}
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {selecionados.filter((usuario) => usuario.erro).map((usuario) => (
                            <p key={usuario.id} className={styles.erro} role="alert">{usuario.nome}: {usuario.erro}</p>
                        ))}
                        {erroAdicionar && <p className={styles.erro} role="alert">{erroAdicionar}</p>}
                    </section>

                    <section className={styles.secao}>
                        <div className={styles.cabecalhoSecao}>
                            <h3 className={styles.tituloSecao}>Membros do grupo{total ? ` (${total})` : ''}</h3>
                            <CampoBusca valor={busca} aoAlterar={alterarBusca} />
                        </div>

                        {erroMembro && <p className={styles.erro} role="alert">{erroMembro}</p>}
                        {erroLista && <p className={styles.erro} role="alert">{erroLista}</p>}

                        {carregando && !erroLista ? (
                            <p className={styles.mensagem} role="status">Carregando membros...</p>
                        ) : (
                            <>
                                <TabelaAdministracao
                                    colunas={colunasMembros}
                                    dados={membrosDaPagina}
                                    mensagemVazia={busca.trim()
                                        ? 'Nenhum membro encontrado para esta busca.'
                                        : 'Nenhum membro neste grupo ainda.'}
                                />
                                <Paginacao {...paginacao} />
                            </>
                        )}
                    </section>
                </div>
            </Modal>

            <ModalConfirmacao
                aberto={confirmandoAdicao}
                titulo={selecionados.length === 1 ? 'Adicionar membro?' : 'Adicionar membros?'}
                mensagem={`Tem certeza que deseja adicionar ${selecionados.length === 1 ? selecionados[0].nome : `${selecionados.length} usuários`} ao grupo ${grupo.nome}?`}
                icone={UserPlus}
                textoConfirmar="Adicionar"
                variante="primario"
                aoCancelar={() => setConfirmandoAdicao(false)}
                aoConfirmar={handleAdicionar}
            />

            <ModalConfirmacao
                aberto={Boolean(membroRemovendo)}
                titulo="Remover membro?"
                mensagem={membroRemovendo ? `Tem certeza que deseja remover ${membroRemovendo.usuario_nome} do grupo ${grupo.nome}?` : ''}
                textoConfirmar="Remover"
                aoCancelar={() => setMembroRemovendo(null)}
                aoConfirmar={() => handleRemover(membroRemovendo)}
            />
        </>
    );
}

export default ModalMembros;
