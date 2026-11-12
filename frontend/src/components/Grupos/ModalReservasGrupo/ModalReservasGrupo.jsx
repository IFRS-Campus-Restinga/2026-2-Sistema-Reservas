import { useState } from 'react';
import useListaPaginada from '../../../hooks/useListaPaginada';
import { useUsuario } from '../../../hooks/useUsuario';
import Modal from '../../Administracao/Modal/Modal';
import CampoBusca from '../../Administracao/CampoBusca/CampoBusca';
import Select from '../../Select/Select';
import Paginacao from '../../Administracao/Paginacao/Paginacao';
import CartaoReserva from '../../CartaoReserva/CartaoReserva';
import ModalDetalheReserva from '../../ModalDetalheReserva/ModalDetalheReserva';
import ReservaAreaModal from '../../ReservaArea/ReservaAreaModal';
import ReservaRecursoGeralModal from '../../ReservaRecursoGeral/ReservaRecursoGeralModal';
import GerenciarRecorrenciaModal from '../../RecorrenciaArea/GerenciarRecorrenciaModal';
import GerenciarRecorrenciaRecursoGeralModal from '../../RecorrenciaRecursoGeral/GerenciarRecorrenciaRecursoGeralModal';
import AlertBanner from '../../AlertBanner/AlertBanner';
import SkeletonListaItens from '../../Skeleton/SkeletonListaItens';
import Botao from '../../Botao/Botao';
import { cancelarReservaArea } from '../../../services';
import { cancelarReservaRecursoGeral } from '../../../services/reservasRecursosGerais';
import { SITUACAO_RESERVA_LABEL } from '../../../utils/reserva';
import { mensagemDeErro } from '../../../utils/erros';
import styles from './ModalReservasGrupo.module.css';

const OPCOES_SITUACAO = [
  { valor: 'todos', rotulo: 'Todas as situações' },
  ...Object.entries(SITUACAO_RESERVA_LABEL).map(([valor, rotulo]) => ({
    valor,
    rotulo,
  })),
];

const MODALIDADES_LABEL = {
  area: 'Área',
  recurso_geral: 'Recurso geral',
};

const STATUS_ALTERAVEIS = ['PENDENTE', 'CONFIRMADA', 'AGUARDANDO_TERMO'];

function formatarDataBR(data) {
  if (!data) return '';
  return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR');
}

function nomeItem(reserva) {
  if (reserva.modalidade === 'area') {
    return reserva.area_detalhe?.nome || `Área #${reserva.area}`;
  }
  if (reserva.modalidade === 'recurso_geral') {
    return reserva.recurso_detalhe?.nome || `Recurso #${reserva.recurso_geral}`;
  }
  return reserva.nome;
}

function detalhesDaReserva(reserva) {
  if (!reserva) return [];
  const detalhes = [];

  detalhes.push({
    rotulo: 'Aluno',
    valor: reserva.usuario_detalhe?.nome || 'Não informado',
  });

  if (reserva.modalidade === 'area') {
    detalhes.push({
      rotulo: 'Local',
      valor: reserva.area_detalhe?.bloco_nome
        ? `${reserva.area_detalhe.nome} (${reserva.area_detalhe.bloco_nome})`
        : reserva.area_detalhe?.nome,
    });
    detalhes.push({
      rotulo: 'Finalidade',
      valor: reserva.aula ? 'Aula regular' : 'Atividade Acadêmica',
    });
  } else if (reserva.modalidade === 'recurso_geral') {
    detalhes.push({
      rotulo: 'Recurso',
      valor: reserva.recurso_detalhe?.nome,
    });
    detalhes.push({
      rotulo: 'Quantidade',
      valor: `${reserva.quantidades || 1} unidade(s)`,
    });
    if (reserva.data_devolucao_prevista) {
      detalhes.push({
        rotulo: 'Devolução prevista',
        valor: formatarDataBR(reserva.data_devolucao_prevista),
      });
    }
  }

  if (reserva.descricao) {
    detalhes.push({ rotulo: 'Observações', valor: reserva.descricao });
  }

  return detalhes;
}

function ModalReservasGrupo({ grupo, aoFechar }) {
  const usuario = useUsuario();
  const [busca, setBusca] = useState('');
  const [situacao, setSituacao] = useState('todos');
  const [selecionada, setSelecionada] = useState(null);
  const [aviso, setAviso] = useState('');
  const [erro, setErro] = useState('');

  const [editandoArea, setEditandoArea] = useState(null);
  const [editandoRecurso, setEditandoRecurso] = useState(null);
  const [recorrenciaGerenciada, setRecorrenciaGerenciada] = useState(null);

  const {
    itens: reservas,
    carregando,
    erro: erroCarregamento,
    recarregar,
    paginacao,
  } = useListaPaginada(`/api/grupos/${grupo.id}/reservas/`, {
    busca,
    situacao: situacao === 'todos' ? undefined : situacao,
    page_size: 10,
  });

  function abrirEdicao(reserva) {
    setSelecionada(null);
    if (reserva.modalidade === 'area') {
      setEditandoArea(reserva);
    } else if (reserva.modalidade === 'recurso_geral') {
      setEditandoRecurso(reserva);
    }
  }

  function abrirRecorrencia(reserva) {
    setSelecionada(null);
    setRecorrenciaGerenciada(reserva);
  }

  async function cancelarSelecionada() {
    if (!selecionada) return;
    try {
      setErro('');
      if (selecionada.modalidade === 'area') {
        await cancelarReservaArea(selecionada.id);
      } else if (selecionada.modalidade === 'recurso_geral') {
        await cancelarReservaRecursoGeral(selecionada.id);
      }
      setSelecionada(null);
      setAviso('Reserva cancelada com sucesso.');
      recarregar();
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível cancelar a reserva.'));
    }
  }

  function salvarEdicaoArea() {
    setEditandoArea(null);
    setAviso('Reserva de área atualizada com sucesso.');
    recarregar();
  }

  function salvarEdicaoRecurso() {
    setEditandoRecurso(null);
    setAviso('Reserva de recurso atualizada com sucesso.');
    recarregar();
  }

  function salvarRecorrencia() {
    setRecorrenciaGerenciada(null);
    setAviso('Recorrência atualizada com sucesso.');
    recarregar();
  }

  function cancelarRecorrenciaConcluida() {
    setRecorrenciaGerenciada(null);
    setAviso('Recorrência cancelada com sucesso.');
    recarregar();
  }

  return (
    <Modal
      aberto
      titulo={`Reservas do Grupo: ${grupo.nome}`}
      aoFechar={aoFechar}
      variante="largo"
      rodape={
        <div className={styles.rodape}>
          <Botao titulo="Fechar" estilo="secundario" aoClicar={aoFechar} />
        </div>
      }
    >
      <div className={styles.modalCorpo}>
        <p className={styles.cabecalhoInfo}>
          Gerencie as reservas realizadas pelos alunos deste grupo no âmbito das autorizações concedidas.
        </p>

        {aviso && <AlertBanner tipo="sucesso" mensagem={aviso} />}
        {erro && <AlertBanner tipo="erro" mensagem={erro} />}
        {erroCarregamento && <AlertBanner tipo="erro" mensagem={erroCarregamento} />}

        <div className={styles.barraFiltros}>
          <CampoBusca
            valor={busca}
            aoMudar={setBusca}
            placeholder="Buscar por reserva ou aluno..."
          />
          <Select
            opcoes={OPCOES_SITUACAO}
            valor={situacao}
            aoMudar={setSituacao}
            aria-label="Filtrar por situação da reserva"
          />
        </div>

        {carregando ? (
          <SkeletonListaItens quantidade={3} />
        ) : reservas.length === 0 ? (
          <div className={styles.vazio}>
            <p>Nenhuma reserva encontrada para os alunos deste grupo.</p>
          </div>
        ) : (
          <div className={styles.lista}>
            {reservas.map((reserva) => (
              <CartaoReserva
                key={`${reserva.modalidade}-${reserva.id}`}
                reserva={reserva}
                modalidade={MODALIDADES_LABEL[reserva.modalidade] || reserva.modalidade}
                aoClicar={() => setSelecionada(reserva)}
              />
            ))}
          </div>
        )}

        <Paginacao {...paginacao} />
      </div>

      {selecionada && (
        <ModalDetalheReserva
          reserva={selecionada}
          modalidade={MODALIDADES_LABEL[selecionada.modalidade] || 'Reserva'}
          item={nomeItem(selecionada)}
          responsavel={selecionada.usuario_detalhe?.nome || 'Aluno'}
          detalhes={detalhesDaReserva(selecionada)}
          aoEditar={
            STATUS_ALTERAVEIS.includes(selecionada.status)
              ? () => abrirEdicao(selecionada)
              : undefined
          }
          aoCancelar={
            STATUS_ALTERAVEIS.includes(selecionada.status)
              ? cancelarSelecionada
              : undefined
          }
          aoGerenciarRecorrencia={
            selecionada.recorrencia && STATUS_ALTERAVEIS.includes(selecionada.status)
              ? () => abrirRecorrencia(selecionada)
              : undefined
          }
          aoFechar={() => setSelecionada(null)}
        />
      )}

      {editandoArea && (
        <ReservaAreaModal
          aberto
          usuario={usuario}
          reservaEdicao={editandoArea}
          aoFechar={() => setEditandoArea(null)}
          aoReservar={salvarEdicaoArea}
        />
      )}

      {editandoRecurso && (
        <ReservaRecursoGeralModal
          aberto
          reservaEdicao={editandoRecurso}
          aoFechar={() => setEditandoRecurso(null)}
          aoReservar={salvarEdicaoRecurso}
        />
      )}

      {recorrenciaGerenciada?.modalidade === 'area' && (
        <GerenciarRecorrenciaModal
          aberto
          recorrenciaId={recorrenciaGerenciada.recorrencia?.id || recorrenciaGerenciada.recorrencia}
          aoFechar={() => setRecorrenciaGerenciada(null)}
          aoSalvar={salvarRecorrencia}
          aoCancelarRecorrencia={cancelarRecorrenciaConcluida}
        />
      )}

      {recorrenciaGerenciada?.modalidade === 'recurso_geral' && (
        <GerenciarRecorrenciaRecursoGeralModal
          aberto
          recorrenciaId={recorrenciaGerenciada.recorrencia?.id || recorrenciaGerenciada.recorrencia}
          aoFechar={() => setRecorrenciaGerenciada(null)}
          aoSalvar={salvarRecorrencia}
          aoCancelarRecorrencia={cancelarRecorrenciaConcluida}
        />
      )}
    </Modal>
  );
}

export default ModalReservasGrupo;
