import useListaPaginada from '../../hooks/useListaPaginada';
import Paginacao from '../../components/Administracao/Paginacao/Paginacao';

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useUsuario } from '../../hooks/useUsuario';
import { ClipboardList, Info, Package, UserRound } from 'lucide-react';
import CartaoReserva from '../../components/CartaoReserva/CartaoReserva';
import ModalDetalheReserva from '../../components/ModalDetalheReserva/ModalDetalheReserva';
import ReservaRecursoGeralModal from '../../components/ReservaRecursoGeral/ReservaRecursoGeralModal';
import ReservaAreaModal from '../../components/ReservaArea/ReservaAreaModal';
import ReservaVeiculoModal from '../../components/ReservaVeiculo/ReservaVeiculoModal';
import TermoReserva from '../../components/TermoReserva/TermoReserva';
import Select from '../../components/Select/Select';
import { cancelarReservaArea, cancelarReservaVeiculo } from '../../services';
import { cancelarReservaRecursoGeral } from '../../services/reservasRecursosGerais';
import { STATUS_RESERVA_LABEL } from '../../utils/reserva';
import { ehAdministrador } from '../../utils/permissoes';
import styles from './MinhasReservas.module.css';

const STATUS_ALTERAVEIS = {
  recurso_geral: ['PENDENTE', 'AGUARDANDO_TERMO'],
  area: ['PENDENTE', 'CONFIRMADA'],
  veiculo: ['PENDENTE', 'AGUARDANDO_TERMO', 'CONFIRMADA'],
};

const MODALIDADES = {
  recurso_geral: 'Recurso geral',
  veiculo: 'Veículo',
  area: 'Área',
  espaco: 'Espaço',
  sala: 'Sala',
};

const OPCOES_TIPO = [
  { valor: 'area', rotulo: 'Áreas' },
  { valor: 'veiculo', rotulo: 'Veículos' },
  { valor: 'recurso_geral', rotulo: 'Recursos' },
];

const OPCOES_STATUS = Object.entries(STATUS_RESERVA_LABEL).map(([valor, rotulo]) => ({
  valor,
  rotulo,
}));

function formatarData(data) {
  if (!data) return '';

  return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR');
}

function MinhasReservas() {
  const usuario = useUsuario();
  const location = useLocation();

  const [editando, setEditando] = useState(null);
  const [editandoArea, setEditandoArea] = useState(null);
  const [editandoVeiculo, setEditandoVeiculo] = useState(null);
  const [selecionada, setSelecionada] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [aviso, setAviso] = useState(
    location.state?.criada
      ? location.state?.tipo === 'veiculo'
        ? 'Reserva enviada! Aguardando confirmação de um administrador.'
        : 'Reserva enviada! Acompanhe sua reserva abaixo.'
      : ''
  );

  const { itens: reservas, erro, setErro, carregando, recarregar, paginacao } = useListaPaginada('/api/reservas/minhas/', { modalidade: filtroTipo, situacao: filtroStatus });
  const recursos = reservas.map((item) => item.recurso_detalhe).filter(Boolean);
  const tipos = reservas.map((item) => item.tipo_detalhe).filter(Boolean);
  const veiculos = reservas.map((item) => item.veiculo_detalhe).filter(Boolean);

  function recursoDaReserva(reserva) {
    return recursos.find(
      (recurso) => String(recurso.id) === String(reserva.recurso_geral)
    );
  }

  function nomeItem(reserva) {
    if (reserva.modalidade === 'recurso_geral') {
      return recursoDaReserva(reserva)?.nome || `Recurso #${reserva.recurso_geral}`;
    }

    if (reserva.modalidade === 'area') {
      return reserva.area_detalhe?.nome || `Área #${reserva.area}`;
    }

    if (reserva.modalidade === 'veiculo') {
      const veiculo = veiculos.find((item) => String(item.id) === String(reserva.veiculo));
      return veiculo ? `${veiculo.nome} · ${veiculo.placa}` : `Veículo #${reserva.veiculo}`;
    }

    return reserva.item || reserva.descricao || 'Não informado';
  }

  function detalhesDaReserva(reserva) {
    if (reserva.modalidade === 'recurso_geral') {
      return [
        {
          rotulo: 'Finalidade',
          valor: reserva.descricao || 'Empréstimo de recurso',
          icone: Info,
        },
        {
          rotulo: 'Quantidade',
          valor: `${reserva.quantidades} unidade(s) · devolução até ${formatarData(reserva.data_devolucao_prevista)}`,
          icone: Package,
        },
      ];
    }

    if (reserva.modalidade === 'area') {
      return [
        {
          rotulo: 'Finalidade',
          valor: reserva.aula ? 'Aula regular' : 'Atividade Acadêmica',
          icone: ClipboardList,
        },
        {
          rotulo: 'Observações',
          valor: reserva.descricao || 'Nenhuma',
        },
      ];
    }

    if (reserva.modalidade === 'veiculo') {
      return [
        { rotulo: 'Finalidade', valor: reserva.finalidade, icone: Info },
        {
          rotulo: 'Destino e ocupantes',
          valor: `${reserva.destino} · ${reserva.quantidade_passageiros} ocupante(s), incluindo motorista`,
          icone: UserRound,
        },
        { rotulo: 'Observações', valor: reserva.descricao },
      ];
    }

    return reserva.detalhes || [];
  }

  function podeAlterar(reserva) {
    const statusAberto = (STATUS_ALTERAVEIS[reserva?.modalidade] || []).includes(reserva?.status);
    if (!statusAberto || reserva?.modalidade !== 'veiculo') return statusAberto;
    if (ehAdministrador(usuario)) return true;

    const inicio = new Date(`${reserva.data}T${reserva.horario_inicio}`);
    return new Date() <= new Date(inicio.getTime() - 60 * 60 * 1000);
  }

  function motivoIndisponivel(reserva) {
    if (!reserva || reserva.modalidade !== 'veiculo') return '';
    const statusAberto = STATUS_ALTERAVEIS.veiculo.includes(reserva.status);
    if (!statusAberto) return 'Esta reserva está em um estado final e não pode mais ser alterada.';
    if (!ehAdministrador(usuario) && !podeAlterar(reserva)) {
      return 'O prazo para editar ou cancelar encerrou uma hora antes da retirada.';
    }
    return '';
  }

  function nomeResponsavel(reserva) {
    if (String(reserva.usuario) === String(usuario?.id)) {
      return usuario.nome;
    }

    return reserva.usuario_nome || 'Não informado';
  }

  async function cancelarSelecionada() {
    const modalidade = selecionada.modalidade;
    modalidade === 'area'
      ? await cancelarReservaArea(selecionada.id)
      : modalidade === 'veiculo'
        ? await cancelarReservaVeiculo(selecionada.id)
        : await cancelarReservaRecursoGeral(selecionada.id);

    recarregar();

    setSelecionada(null);
    setAviso('Reserva cancelada.');
  }

  function abrirEdicao(reserva) {
    if (reserva.modalidade === 'area') {
      setSelecionada(null);
      setEditandoArea(reserva);
      return;
    }

    if (reserva.modalidade === 'veiculo') {
      const veiculo = veiculos.find((item) => String(item.id) === String(reserva.veiculo));
      if (!veiculo) {
        setErro('Não foi possível encontrar o veículo desta reserva.');
        return;
      }
      setSelecionada(null);
      setEditandoVeiculo({ reserva, veiculo });
      return;
    }

    const recurso = recursoDaReserva(reserva);

    const tipo = tipos.find(
      (item) => String(item.id) === String(recurso?.tipo_recurso)
    );

    if (!recurso || !tipo) {
      setErro('Não foi possível encontrar o recurso desta reserva.');
      return;
    }

    setSelecionada(null);

    setEditando({
      reserva,
      recurso,
      tipo: {
        ...tipo,
        recursos: recursos.filter(
          (item) => String(item.tipo_recurso) === String(tipo.id)
        ),
      },
    });
  }

  function salvarEdicao() {
    recarregar();

    setEditando(null);
    setAviso('Reserva atualizada.');
  }

  function salvarEdicaoArea() {
    recarregar();

    setEditandoArea(null);
    setAviso('Reserva atualizada.');
  }

  function salvarEdicaoVeiculo() {
    recarregar();
    setEditandoVeiculo(null);
    setAviso('Reserva atualizada.');
  }

  function periodoVeiculo(reserva) {
    if (reserva?.modalidade !== 'veiculo') return undefined;
    return `${formatarData(reserva.data)} · ${String(reserva.horario_inicio).slice(0, 5)} até ${formatarData(reserva.data_devolucao_prevista)} · ${String(reserva.horario_fim).slice(0, 5)}`;
  }

  const ordenadas = reservas;

  function atualizarSituacaoTermo(dados) {
    recarregar();
    setSelecionada((atual) => {
      if (atual?.id === dados.reserva) {
        return { ...atual, status: dados.status_reserva };
      }
      return atual;
    });
  }

  return (
    <div className={styles.pagina}>
      {carregando && <p role="status">Carregando reservas...</p>}
      {aviso && (
        <p className={styles.aviso}>
          {aviso}
        </p>
      )}

      {erro && (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      )}

      <div className="d-flex flex-wrap gap-2">
        <Select
          valor={filtroTipo}
          aoAlterar={setFiltroTipo}
          opcoes={OPCOES_TIPO}
          valorTodos="todos"
          rotuloTodos="Todos os tipos"
          ariaLabel="Filtrar por tipo"
        />

        <Select
          valor={filtroStatus}
          aoAlterar={setFiltroStatus}
          opcoes={OPCOES_STATUS}
          valorTodos="todos"
          rotuloTodos="Todas"
          ariaLabel="Filtrar por status"
        />
      </div>

      <section className={styles.lista} aria-label="Minhas reservas">
        {ordenadas.length === 0 && (
          <p className={styles.vazio}>
            Você ainda não possui reservas cadastradas.
          </p>
        )}

        {ordenadas.map((reserva) => (
          <CartaoReserva
            key={`${reserva.modalidade}-${reserva.id}`}
            reserva={{
              ...reserva,
              descricao: nomeItem(reserva),
            }}
            modalidade={MODALIDADES[reserva.modalidade] || 'Reserva'}
            periodo={periodoVeiculo(reserva)}
            mostrarStatus={true}
            mostrarDisponibilidadeRetirada={reserva.modalidade === 'veiculo'}
            aoClicar={() => setSelecionada(reserva)}
          />
        ))}
      </section>

      <Paginacao {...paginacao} />

      {selecionada && (
        <ModalDetalheReserva
          reserva={selecionada}
          modalidade={MODALIDADES[selecionada.modalidade] || 'Reserva'}
          item={nomeItem(selecionada)}
          responsavel={nomeResponsavel(selecionada)}
          periodo={periodoVeiculo(selecionada)}
          exigeTermo={selecionada.modalidade === 'recurso_geral' && Boolean(recursoDaReserva(selecionada)?.tem_termo_de_responsabilidade)}
          aoAtualizarTermo={atualizarSituacaoTermo}
          conteudoExtra={selecionada.modalidade === 'veiculo' ? (
            <>
              <TermoReserva reservaId={selecionada.id} modalidade="veiculo" tipoDocumento="retirada" ocultarIndisponivel />
              <TermoReserva reservaId={selecionada.id} modalidade="veiculo" tipoDocumento="devolucao" ocultarIndisponivel />
            </>
          ) : null}
          detalhes={detalhesDaReserva(selecionada)}
          aoEditar={podeAlterar(selecionada) ? () => abrirEdicao(selecionada) : undefined}
          aoCancelar={podeAlterar(selecionada) ? cancelarSelecionada : undefined}
          motivoAcoesIndisponiveis={motivoIndisponivel(selecionada)}
          aoFechar={() => setSelecionada(null)}
        />
      )}

      {editando && (
        <ReservaRecursoGeralModal
          aberto
          tipo={editando.tipo}
          recursoInicial={editando.recurso}
          reservaEdicao={editando.reserva}
          aoFechar={() => setEditando(null)}
          aoReservar={salvarEdicao}
        />
      )}

      {editandoArea && (
        <ReservaAreaModal
          aberto
          areaInicial={null}
          usuario={usuario}
          reservaEdicao={editandoArea}
          aoFechar={() => setEditandoArea(null)}
          aoReservar={salvarEdicaoArea}
        />
      )}

      {editandoVeiculo && (
        <ReservaVeiculoModal
          aberto
          veiculoInicial={editandoVeiculo.veiculo}
          veiculos={veiculos}
          reservaEdicao={editandoVeiculo.reserva}
          aoFechar={() => setEditandoVeiculo(null)}
          aoReservar={salvarEdicaoVeiculo}
        />
      )}
    </div>
  );
}

export default MinhasReservas;
