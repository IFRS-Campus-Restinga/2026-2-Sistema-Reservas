import useListaPaginada from '../../../hooks/useListaPaginada';
import Paginacao from '../Paginacao/Paginacao';
import { useState } from 'react';
import { Pencil, Plus, Trash2, ToggleLeft, ToggleRight, CheckCircle, XCircle } from 'lucide-react';
import styles from './AreasAdmin.module.css';

import { criarArea, atualizarArea, excluirArea } from '../../../services';

import TabelaAdministracao from '../TabelaAdmin/TabelaAdmin';
import AreaModal from './ModalArea/AreaModal';
import ModalConfirmacao from '../ModalConfirmacao/ModalConfirmacao';
import CampoBusca from '../CampoBusca/CampoBusca';
import BarraFiltros from '../../BarraFiltros/BarraFiltros';
import Select from '../../Select/Select';
import SelectRemoto from '../../SelectRemoto/SelectRemoto';
import { OPCOES_STATUS_RECURSO, STATUS_RECURSO_LABEL } from '../../../utils/statusRecurso';
import { TIPO_AREA_LABEL } from '../../../utils/tipoArea';
import AlertBanner from '../../AlertBanner/AlertBanner';

function AreasAdministracao() {

    const [modalAreaAberto, setModalAreaAberto] = useState(false);
    const [areaEditando, setAreaEditando] = useState(null);
    const [areaExcluindo, setAreaExcluindo] = useState(null);
    const [aviso, setAviso] = useState(null);
    const [busca, setBusca] = useState('');
    const [filtroBloco, setFiltroBloco] = useState('todos');
    const [filtroStatus, setFiltroStatus] = useState('todos');

    const { itens: areas, carregando, erro, setErro, recarregar: carregarDados, paginacao } = useListaPaginada('/api/areas/', { busca, bloco: filtroBloco, status: filtroStatus });
    const filtrando = Boolean(busca.trim()) || filtroBloco !== 'todos' || filtroStatus !== 'todos';

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
        setAviso({ tipo: 'sucesso', mensagem: areaEditando ? 'Área atualizada com sucesso.' : 'Área cadastrada com sucesso.' });

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
            setAviso({ tipo: 'sucesso', mensagem: 'Área excluída com sucesso.' });
        } catch (erro) {
            console.error(erro);
            setAviso({ tipo: 'erro', mensagem: 'Não foi possível excluir a área.' });
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
            renderizar: (area) => area.bloco_nome || area.bloco
        },
        {
            chave: 'capacidade',
            titulo: 'Capacidade',
            renderizar: (area) => `${area.capacidade} pessoas`,
        },
        {
            chave: 'tipo',
            titulo: 'Tipo',
            renderizar: (area) => TIPO_AREA_LABEL[area.tipo] || area.tipo,
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
                    {STATUS_RECURSO_LABEL[area.status] || area.status}
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
                    placeholder="Buscar área por nome..."
                />
                <SelectRemoto
                    url="/api/blocos/"
                    valor={filtroBloco}
                    aoAlterar={setFiltroBloco}
                    valorTodos="todos"
                    rotuloTodos="Todos os blocos"
                    ariaLabel="Filtrar áreas por bloco"
                    placeholderBusca="Buscar bloco..."
                />
                <Select
                    valor={filtroStatus}
                    aoAlterar={setFiltroStatus}
                    opcoes={OPCOES_STATUS_RECURSO}
                    valorTodos="todos"
                    rotuloTodos="Todos os status"
                    ariaLabel="Filtrar áreas por status"
                />
            </BarraFiltros>

            <AlertBanner tipo={aviso?.tipo} mensagem={aviso?.mensagem} aoFechar={() => setAviso(null)} />

            <AlertBanner tipo="erro" mensagem={erro} />

            <TabelaAdministracao
                carregando={carregando}
                rotuloCarregando="Carregando áreas..."
                colunas={colunas}
                dados={areas}
                mensagemVazia={filtrando
                    ? 'Nenhuma área encontrada para os filtros aplicados.'
                    : 'Nenhuma área cadastrada.'}
            />

            <Paginacao {...paginacao} />

            <AreaModal
                aberto={modalAreaAberto}
                area={areaEditando}
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
