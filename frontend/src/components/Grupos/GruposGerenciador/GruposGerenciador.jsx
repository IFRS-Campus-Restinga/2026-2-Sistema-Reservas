import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus } from 'lucide-react';
import {
    buscarGrupos,
    criarGrupo,
    atualizarGrupo,
    excluirGrupo,
    listarTiposRecurso,
} from '../../../services';

import Botao from '../../Botao/Botao';
import CampoBusca from '../../Administracao/CampoBusca/CampoBusca';
import ModalConfirmacao from '../../Administracao/ModalConfirmacao/ModalConfirmacao';
import CardGrupo from '../CardGrupo/CardGrupo';
import GrupoModal from '../ModalGrupo/GrupoModal';
import styles from './GruposGerenciador.module.css';

function GruposGerenciador({ apenasMeusGrupos = false }) {
    const { usuario } = useOutletContext();
    const ehAdmin = usuario.papel === 'admin';
    const podeCriarGrupo = usuario.papel === 'admin' || usuario.papel === 'servidor';

    const [grupos, setGrupos] = useState([]);
    const [tiposRecurso, setTiposRecurso] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    const [tipoAtivo, setTipoAtivo] = useState(ehAdmin ? 'servidor' : 'aluno');
    const [busca, setBusca] = useState('');

    const [modalAberto, setModalAberto] = useState(false);
    const [grupoEditando, setGrupoEditando] = useState(null);
    const [grupoExcluindo, setGrupoExcluindo] = useState(null);

    useEffect(() => {
        listarTiposRecurso()
            .then(setTiposRecurso)
            .catch((erro) => console.error(erro));
        carregarGrupos();
    }, []);

    async function carregarGrupos() {
        try {
            setCarregando(true);
            setErro('');

            const dados = await buscarGrupos();

            setGrupos(dados);
        } catch (erro) {
            console.error(erro);
            setErro('Não foi possível carregar os grupos.');
        } finally {
            setCarregando(false);
        }
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
        } catch (erro) {
            console.error(erro);
            setErro('Não foi possível excluir o grupo.');
        }
    }

    const termoBusca = busca.trim().toLowerCase();
    const gruposVisiveis = apenasMeusGrupos
        ? grupos.filter((grupo) => grupo.criador === usuario.id)
        : grupos;
    const gruposServidor = gruposVisiveis.filter((grupo) => grupo.tipo_membro_permitido === 'servidor');
    const gruposAluno = gruposVisiveis.filter((grupo) => grupo.tipo_membro_permitido === 'aluno');
    const gruposDaTela = gruposVisiveis
        .filter((grupo) => grupo.tipo_membro_permitido === tipoAtivo)
        .filter((grupo) => grupo.nome.toLowerCase().includes(termoBusca));

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
                        Servidores ({gruposServidor.length})
                    </button>
                    <button
                        type="button"
                        className={styles.tipoBotao}
                        data-ativo={tipoAtivo === 'aluno'}
                        onClick={() => setTipoAtivo('aluno')}
                    >
                        Alunos ({gruposAluno.length})
                    </button>
                </div>
            ) : (
                <h2 className={styles.tituloUnico}>Grupos de Alunos</h2>
            )}

            <div className={styles.barraAcoes}>
                <CampoBusca
                    valor={busca}
                    aoAlterar={setBusca}
                    placeholder="Buscar grupo por nome..."
                />
                {podeCriarGrupo && (
                    <Botao
                        titulo="Novo grupo"
                        icone={Plus}
                        estilo="primario"
                        aoClicar={abrirCadastro}
                    />
                )}
            </div>

            {erro && (
                <p className={styles.erro} role="alert">{erro}</p>
            )}

            {carregando ? (
                <p className={styles.carregando} role="status">Carregando grupos...</p>
            ) : gruposDaTela.length === 0 ? (
                <p className={styles.vazio}>
                    {termoBusca
                        ? 'Nenhum grupo encontrado para esta busca.'
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
                            tiposRecurso={tiposRecurso}
                            aoEditar={abrirEdicao}
                            aoExcluir={solicitarExclusao}
                        />
                    ))}
                </div>
            )}

            {modalAberto && (
                <GrupoModal
                    grupo={grupoEditando}
                    tiposRecurso={tiposRecurso}
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
