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
import Tooltip from '../../Tooltip/Tooltip';
import DicaInfo from '../../Tooltip/DicaInfo';
import { formatarValidadeMembro, formatarVigenciaGrupo, extrairMensagemErro } from '../gruposUtils';
import AlertBanner from '../../AlertBanner/AlertBanner';
import styles from './ModalMembros.module.css';

const TAMANHO_PAGINA = 10;

function ModalMembros({ grupo, aoFechar }) {
    const [busca, setBusca] = useState('');
    const [selecionados, setSelecionados] = useState([]);
    const [validoAte, setValidoAte] = useState('');
    const [adicionando, setAdicionando] = useState(false);
    const [avisoAdicionar, setAvisoAdicionar] = useState(null);
    const [confirmandoAdicao, setConfirmandoAdicao] = useState(false);
    const [membroRemovendo, setMembroRemovendo] = useState(null);
    const [processandoId, setProcessandoId] = useState(null);
    const [avisoMembro, setAvisoMembro] = useState(null);

    const { itens: membros, total, erro: erroLista, carregando, recarregar, paginacao } = useListaPaginada(`/api/grupos/${grupo.id}/membros/`, { busca, page_size: TAMANHO_PAGINA });
    const membrosDaPagina = membros;
    const selecionadosComErro = selecionados.filter((usuario) => usuario.erro);
    const alterarBusca = setBusca;

    async function handleAdicionar() {
        setConfirmandoAdicao(false);
        try {
            setAdicionando(true);
            setAvisoAdicionar(null);
            await adicionarMembros(
                grupo.id,
                selecionados.map(({ id }) => ({ usuario: id, data_fim_validade: validoAte || null }))
            );
            recarregar();
            setAvisoAdicionar({
                tipo: 'sucesso',
                mensagem: selecionados.length === 1
                    ? '1 membro adicionado com sucesso.'
                    : `${selecionados.length} membros adicionados com sucesso.`,
            });
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
                setAvisoAdicionar({ tipo: 'erro', mensagem: extrairMensagemErro(erro, 'Não foi possível adicionar os membros.') });
            }
        } finally {
            setAdicionando(false);
        }
    }

    async function alterarMembro(membro, acao, mensagemSucesso, mensagemPadrao) {
        try {
            setProcessandoId(membro.id);
            setAvisoMembro(null);
            await acao();
            setAvisoMembro({ tipo: 'sucesso', mensagem: mensagemSucesso });
        } catch (erro) {
            setAvisoMembro({ tipo: 'erro', mensagem: extrairMensagemErro(erro, mensagemPadrao) });
        } finally {
            setProcessandoId(null);
        }
    }

    function handleRemover(membro) {
        setMembroRemovendo(null);
        return alterarMembro(membro, async () => {
            await removerMembro(grupo.id, membro.id);
            recarregar();
        }, 'Membro removido com sucesso.', 'Não foi possível remover o membro.');
    }

    function handleAlterarValidade(membro, evento) {
        if (!evento.target.validity.valid) {
            return;
        }
        return alterarMembro(membro, async () => {
            await atualizarMembro(grupo.id, membro.id, { data_fim_validade: evento.target.value || null });
            recarregar();
        }, 'Validade atualizada com sucesso.', 'Não foi possível atualizar a validade do membro.');
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
                <Tooltip texto="Remover membro do grupo">
                    <button
                        type="button"
                        className={styles.removerMembro}
                        onClick={() => setMembroRemovendo(membro)}
                        disabled={processandoId === membro.id}
                        aria-label={`Remover ${membro.usuario_nome} do grupo`}
                    >
                        <X size={14} />
                    </button>
                </Tooltip>
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
                    <p className={styles.vigencia}>Vigência do grupo: {formatarVigenciaGrupo(grupo)}</p>

                    <section className={styles.secao}>
                        <div className={styles.tituloComDica}>
                            <h3 className={styles.tituloSecao}>Adicionar membros</h3>
                            <DicaInfo
                                texto="Os membros adicionados só conseguem reservar durante a vigência do grupo e até a data limite individual, se informada."
                                rotulo="Explicação sobre validade dos membros"
                            />
                        </div>
                        <form className={styles.formAdicionar} onSubmit={(evento) => { evento.preventDefault(); setConfirmandoAdicao(true); }}>
                            <BuscaUsuario
                                grupoId={grupo.id}
                                idsSelecionados={selecionados.map((usuario) => usuario.id)}
                                idsMembros={(membros ?? []).map((membro) => membro.usuario)}
                                aoSelecionar={(usuario) => setSelecionados((anteriores) => [...anteriores, usuario])}
                                placeholder="Buscar usuário para adicionar..."
                            />
                            <Tooltip texto="Deixe em branco para seguir a validade do grupo.">
                                <input
                                    type="date"
                                    className={styles.campoData}
                                    value={validoAte}
                                    onChange={(evento) => setValidoAte(evento.target.value)}
                                    aria-label="Válido até"
                                />
                            </Tooltip>
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

                        <AlertBanner
                            tipo="erro"
                            mensagem={selecionadosComErro.length > 0 && (
                                <>
                                    <p className="mb-1">Não foi possível adicionar:</p>
                                    <ul className="mb-0 ps-3">
                                        {selecionadosComErro.map((usuario) => (
                                            <li key={usuario.id}>{usuario.nome}: {usuario.erro}</li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        />
                        <AlertBanner tipo={avisoAdicionar?.tipo} mensagem={avisoAdicionar?.mensagem} aoFechar={() => setAvisoAdicionar(null)} />
                    </section>

                    <section className={styles.secao}>
                        <div className={styles.cabecalhoSecao}>
                            <h3 className={styles.tituloSecao}>Membros do grupo{total ? ` (${total})` : ''}</h3>
                            <CampoBusca valor={busca} aoAlterar={alterarBusca} />
                        </div>

                        <AlertBanner tipo={avisoMembro?.tipo} mensagem={avisoMembro?.mensagem} aoFechar={() => setAvisoMembro(null)} />
                        <AlertBanner tipo="erro" mensagem={erroLista} />

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
