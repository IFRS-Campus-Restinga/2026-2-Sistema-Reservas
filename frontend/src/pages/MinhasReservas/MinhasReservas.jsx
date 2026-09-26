
import { useEffect, useState } from 'react';
import { Link, useLocation, useOutletContext } from 'react-router-dom';
import { CalendarCheck, ClipboardList } from 'lucide-react';
import CartaoReserva from '../../components/CartaoReserva/CartaoReserva';
import ModalDetalheReserva from '../../components/ModalDetalheReserva/ModalDetalheReserva';
import ReservaRecursoGeralModal from '../../components/ReservaRecursoGeral/ReservaRecursoGeralModal';
import { listarRecursosGerais, listarTiposRecurso } from '../../services';
import {
  listarReservasRecursosGerais,
  cancelarReservaRecursoGeral,
} from '../../services/reservasRecursosGerais';

import styles from './MinhasReservas.module.css';

const MODALIDADES = {
  recurso_geral: 'Recurso geral',
  veiculo: 'Veículo',
  area: 'Área',
  espaco: 'Espaço',
  sala: 'Sala',
};

function formatarData(data) {
  if (!data) return '';

  return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR');
}

function MinhasReservas() {
  const { usuario } = useOutletContext();
  const location = useLocation();

  const [reservas, setReservas] = useState([]);
  const [recursos, setRecursos] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [editando, setEditando] = useState(null);
  const [selecionada, setSelecionada] = useState(null);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState(
    location.state?.criada
      ? 'Reserva enviada! Acompanhe sua reserva abaixo.'
      : ''
  );

  useEffect(() => {
    Promise.all([
      listarReservasRecursosGerais(),
      listarRecursosGerais(),
      listarTiposRecurso(),
    ])
      .then(([listaReservas, listaRecursos, listaTipos]) => {
        setErro('');

        setReservas(
          listaReservas.map((reserva) => ({
            ...reserva,
            modalidade: 'recurso_geral',
          }))
        );

        setRecursos(listaRecursos);
        setTipos(listaTipos);
      })
      .catch((falha) => setErro(falha.message));
  }, []);

  function recursoDaReserva(reserva) {
    return recursos.find(
      (recurso) => String(recurso.id) === String(reserva.recurso_geral)
    );
  }

  function nomeItem(reserva) {
    if (reserva.modalidade === 'recurso_geral') {
      return recursoDaReserva(reserva)?.nome || `Recurso #${reserva.recurso_geral}`;
    }

    return reserva.item || reserva.descricao || 'Não informado';
  }

  function nomeResponsavel(reserva) {
    if (String(reserva.usuario) === String(usuario?.id)) {
      return usuario.nome;
    }

    return reserva.usuario_nome || 'Não informado';
  }

  async function cancelarSelecionada() {
    const atualizada = await cancelarReservaRecursoGeral(selecionada.id);

    setReservas((atuais) =>
      atuais.map((reserva) =>
        reserva.modalidade === 'recurso_geral' &&
        reserva.id === atualizada.id
          ? { ...atualizada, modalidade: 'recurso_geral' }
          : reserva
      )
    );

    setSelecionada(null);
    setAviso('Reserva cancelada.');
  }

  function abrirEdicao(reserva) {
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

  function salvarEdicao(atualizada) {
    setReservas((atuais) =>
      atuais.map((reserva) =>
        reserva.modalidade === 'recurso_geral' &&
        String(reserva.id) === String(atualizada.id)
          ? { ...atualizada, modalidade: 'recurso_geral' }
          : reserva
      )
    );

    setEditando(null);
    setAviso('Reserva atualizada.');
  }

  const ordenadas = [...reservas].sort((a, b) =>
    `${b.data} ${b.horario_inicio}`.localeCompare(
      `${a.data} ${a.horario_inicio}`
    )
  );

  const recurso =
    selecionada?.modalidade === 'recurso_geral'
      ? recursoDaReserva(selecionada)
      : null;

  const ehRecurso = selecionada?.modalidade === 'recurso_geral';

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecalho}>
        <div>
          <h2>Minhas reservas</h2>
          <p>Consulte os detalhes das suas reservas em um só lugar.</p>
        </div>

        <Link to="/recursos" className={styles.nova}>
          Nova reserva
        </Link>
      </div>

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
            mostrarStatus={false}
            aoClicar={() => setSelecionada(reserva)}
          />
        ))}
      </section>

      {selecionada && (
        <ModalDetalheReserva
          reserva={selecionada}
          modalidade={MODALIDADES[selecionada.modalidade] || 'Reserva'}
          item={nomeItem(selecionada)}
          responsavel={nomeResponsavel(selecionada)}
          exigeTermo={
            ehRecurso
              ? Boolean(recurso?.tem_termo_de_responsabilidade)
              : Boolean(selecionada.exigeTermo)
          }
          detalhes={
            ehRecurso
              ? [
                  {
                    rotulo: 'Finalidade',
                    valor: 'Empréstimo de recurso',
                    icone: ClipboardList,
                  },
                  {
                    rotulo: 'Quantidade',
                    valor: selecionada.quantidades,
                    icone: ClipboardList,
                  },
                  {
                    rotulo: 'Devolução prevista',
                    valor: formatarData(selecionada.data_devolucao_prevista),
                    icone: CalendarCheck,
                  },
                  {
                    rotulo: 'Observações',
                    valor: selecionada.descricao || 'Nenhuma',
                  },
                ]
              : selecionada.detalhes || []
          }
          aoEditar={
            ehRecurso &&
            ['PENDENTE', 'AGUARDANDO_TERMO'].includes(selecionada.status)
              ? () => abrirEdicao(selecionada)
              : undefined
          }
          aoCancelar={
            ehRecurso &&
            ['PENDENTE', 'AGUARDANDO_TERMO'].includes(selecionada.status)
              ? cancelarSelecionada
              : undefined
          }
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
    </div>
  );
}

export default MinhasReservas;
