import useListaPaginada from '../../../hooks/useListaPaginada';
import Paginacao from '../../Administracao/Paginacao/Paginacao';
import SelectRemoto from '../../SelectRemoto/SelectRemoto';
import { useState } from 'react';
import { useUsuario } from '../../../hooks/useUsuario';
import { Plus } from 'lucide-react';
import { criarGrupo, atualizarGrupo, excluirGrupo } from '../../../services';

import { ehAdministrador, podeGerenciarGrupos } from '../../../utils/permissoes';
import Botao from '../../Botao/Botao';
import BarraFiltros from '../../BarraFiltros/BarraFiltros';
import CampoBusca from '../../Administracao/CampoBusca/CampoBusca';
import Select from '../../Select/Select';
import ModalConfirmacao from '../../Administracao/ModalConfirmacao/ModalConfirmacao';
import CardGrupo from '../CardGrupo/CardGrupo';
import GrupoModal from '../ModalGrupo/GrupoModal';
import { FILTRO_TODOS } from '../gruposUtils';
import { TIPO_RECURSO_RESERVAVEL, TIPO_RECURSO_RESERVAVEL_LABEL } from '../../../utils/tipoRecursoReservavel';
import AlertBanner from '../../AlertBanner/AlertBanner';
import styles from './GruposGerenciador.module.css';

const OPCOES_RECURSO = Object.entries(TIPO_RECURSO_RESERVAVEL_LABEL)
    .map(([valor, rotulo]) => ({ valor, rotulo }));

function GruposGerenciador({ apenasMeusGrupos = false }) {
    const usuario = useUsuario();
    const ehAdmin = ehAdministrador(usuario);
    const podeCriarGrupo = podeGerenciarGrupos(usuario);


    const [tipoAtivo, setTipoAtivo] = useState(ehAdmin ? 'servidor' : 'aluno');
    const [busca, setBusca] = useState('');
    const [filtroRecurso, setFiltroRecurso] = useState(FILTRO_TODOS);
    const [filtroTiposRecurso, setFiltroTiposRecurso] = useState([]);

    const [modalAberto, setModalAberto] = useState(false);
    const [grupoEditando, setGrupoEditando] = useState(null);
    const [grupoExcluindo, setGrupoExcluindo] = useState(null);
    const [aviso, setAviso] = useState(null);

    const { itens: gruposDaTela, carregando, erro, setErro, recarregar: carregarGrupos, paginacao } = useListaPaginada('/api/grupos/', { busca, tipo_membro: tipoAtivo, recurso: filtroRecurso, tipo_recurso: filtroTiposRecurso.join(','), meus: apenasMeusGrupos });
    const filtrandoRecursoGeral = filtroRecurso === TIPO_RECURSO_RESERVAVEL.RECURSO_GERAL;

    function selecionarFiltroRecurso(recurso) {
        setFiltroRecurso(recurso);
        setFiltroTiposRecurso([]);
    }

    function abrirCadastro() {
        setGrupoEditando(null);
        setModalAberto(true);
    }

    function abrirEdicao(grupo) {
        setGrupoEditando(grupo);
        setModalAberto(true);
    }

    function fecharModal() {
        setModalAberto(false);
        setGrupoEditando(null);
    }

    async function salvarGrupo(dados) {
        setErro('');

        if (grupoEditando) {
            await atualizarGrupo(grupoEditando.id, dados);
        } else {
            await criarGrupo(dados);
        }
        fecharModal();
        setAviso({ tipo: 'sucesso', mensagem: grupoEditando ? 'Grupo atualizado com sucesso.' : 'Grupo cadastrado com sucesso.' });

        await carregarGrupos();
    }

    function solicitarExclusao(grupo) {
        setGrupoExcluindo(grupo);
    }

    async function confirmarExclusao() {
        if (!grupoExcluindo) {
            return;
        }
        try {
            setErro('');

            await excluirGrupo(grupoExcluindo.id);

            setGrupoExcluindo(null);

            await carregarGrupos();
            setAviso({ tipo: 'sucesso', mensagem: 'Grupo excluído com sucesso.' });
        } catch (erro) {
            console.error(erro);
            setAviso({ tipo: 'erro', mensagem: 'Não foi possível excluir o grupo.' });
        }
    }

    const filtrando = Boolean(busca.trim()) || filtroRecurso !== FILTRO_TODOS;

    return (
        <div className={styles.gerenciador}>
            {ehAdmin ? (
                <div className={styles.tipoToggle} role="group" aria-label="Tipo de grupo">
                    <button
                        type="button"
                        className={styles.tipoBotao}
                        data-ativo={tipoAtivo === 'servidor'}
                        onClick={() => setTipoAtivo('servidor')}
                    >
                        Servidores
                    </button>
                    <button
                        type="button"
                        className={styles.tipoBotao}
                        data-ativo={tipoAtivo === 'aluno'}
                        onClick={() => setTipoAtivo('aluno')}
                    >
                        Alunos
                    </button>
                </div>
            ) : (
                <h2 className={styles.tituloUnico}>Grupos de Alunos</h2>
            )}

            <BarraFiltros
                acoes={podeCriarGrupo && (
                    <Botao
                        titulo="Novo grupo"
                        icone={Plus}
                        estilo="primario"
                        aoClicar={abrirCadastro}
                    />
                )}
            >
                <CampoBusca
                    valor={busca}
                    aoAlterar={setBusca}
                    placeholder="Buscar grupo por nome..."
                />
                <Select
                    valor={filtroRecurso}
                    aoAlterar={selecionarFiltroRecurso}
                    opcoes={OPCOES_RECURSO}
                    valorTodos={FILTRO_TODOS}
                    rotuloTodos="Todos os recursos"
                    ariaLabel="Filtrar por recurso"
                />
                {filtrandoRecursoGeral && (
                    <SelectRemoto url="/api/tipos-recurso/"
                        valor={filtroTiposRecurso}
                        aoAlterar={setFiltroTiposRecurso}
                        rotuloTodos="Todos os tipos de recurso"
                        multiplo
                        ariaLabel="Filtrar por tipo de recurso geral"
                        placeholderBusca="Buscar tipo..."
                    />
                )}
            </BarraFiltros>

            <AlertBanner tipo={aviso?.tipo} mensagem={aviso?.mensagem} aoFechar={() => setAviso(null)} />

            <AlertBanner tipo="erro" mensagem={erro} />

            {carregando ? (
                <p className={styles.carregando} role="status">Carregando grupos...</p>
            ) : gruposDaTela.length === 0 ? (
                <p className={styles.vazio}>
                    {filtrando
                        ? 'Nenhum grupo encontrado para os filtros aplicados.'
                        : apenasMeusGrupos
                            ? 'Você ainda não criou nenhum grupo nesta categoria.'
                            : 'Nenhum grupo cadastrado nesta categoria.'}
                </p>
            ) : (
                <div className={styles.lista}>
                    {gruposDaTela.map((grupo) => (
                        <CardGrupo
                            key={grupo.id}
                            grupo={grupo}
                            aoEditar={abrirEdicao}
                            aoExcluir={solicitarExclusao}
                            aoAtualizar={carregarGrupos}
                        />
                    ))}
                </div>
            )}

            <Paginacao {...paginacao} />
            {modalAberto && (
                <GrupoModal
                    grupo={grupoEditando}
                    ehAdmin={ehAdmin}
                    tipoInicial={tipoAtivo}
                    aoFechar={fecharModal}
                    aoSalvar={salvarGrupo}
                />
            )}

            <ModalConfirmacao
                aberto={Boolean(grupoExcluindo)}
                titulo="Excluir grupo?"
                mensagem={
                    grupoExcluindo
                        ? `Tem certeza que deseja excluir o grupo ${grupoExcluindo.nome}? Todos os membros também serão removidos.`
                        : ''
                }
                aoCancelar={() => setGrupoExcluindo(null)}
                aoConfirmar={confirmarExclusao}
            />
        </div>
    );
}

export default GruposGerenciador;
