import SelectRemoto from '../SelectRemoto/SelectRemoto';
import useListaPaginada from '../../hooks/useListaPaginada';
import useDisponibilidadeReserva, { intervaloDisponivel } from '../../hooks/useDisponibilidadeReserva';
import { useEffect, useState } from 'react';
import { Form, Alert } from 'react-bootstrap';
import { CheckCircle2 } from 'lucide-react';
import Modal from '../Administracao/Modal/Modal';
import Botao from '../Botao/Botao';
import CalendarioReserva from '../CalendarioReserva/CalendarioReserva';
import CamposRecorrencia from '../CamposRecorrencia/CamposRecorrencia';
import { criarReservaArea, atualizarReservaArea } from '../../services/reservasAreas';
import { TURNO_LABEL, PERIODOS_POR_TURNO } from '../../utils/periodosAula';
import { horarioParaMinutos } from '../../utils/data';
import { TIPO_RECORRENCIA, conflitosRecorrencia, gerarDatasRecorrencia, montarRecorrencia, validarRecorrencia } from '../../utils/recorrencia';
import styles from './ReservaAreaModal.module.css';

const HORARIOS = Array.from({ length: 32 }, (_, indice) => {
  const total = 7 * 60 + indice * 30;
  const horas = String(Math.floor(total / 60)).padStart(2, '0');
  const minutos = String(total % 60).padStart(2, '0');

  return `${horas}:${minutos}`;
});

// Término sugerido: uma hora depois do início, limitado ao último horário da lista
function horarioFimSugerido(horarioInicio) {
  const total = Math.min(
    horarioParaMinutos(horarioInicio) + 60,
    horarioParaMinutos(HORARIOS[HORARIOS.length - 1])
  );

  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function ReservaAreaModal({
  aberto,
  areaInicial,
  usuario,
  reservaEdicao,
  dataInicial,
  horarioInicial,
  aoFechar,
  aoReservar,
}) {
  const [areaId, setAreaId] = useState('');
  const [blocoId, setBlocoId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState('');
  const [mes, setMes] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [aula, setAula] = useState(false);
  const [turno, setTurno] = useState('manha');
  const [periodosSelecionados, setPeriodosSelecionados] = useState([]);
  const [horarioInicio, setHorarioInicio] = useState('08:00');
  const [horarioFim, setHorarioFim] = useState('10:00');
  const [participantes, setParticipantes] = useState(10);
  const [observacoes, setObservacoes] = useState('');
  const [recorrente, setRecorrente] = useState(false);
  const [tipoRecorrencia, setTipoRecorrencia] = useState(TIPO_RECORRENCIA.SEMANAL);
  const [dataFimRecorrencia, setDataFimRecorrencia] = useState('');
  const [conflitos, setConflitos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!aberto) return;

    setAreaId(String(reservaEdicao?.area || areaInicial?.id || ''));
    setBlocoId(String(reservaEdicao?.area_detalhe?.bloco || areaInicial?.bloco || ''));
    setTitulo(reservaEdicao?.nome || '');
    const dataPreenchida = reservaEdicao?.data || dataInicial || '';
    const inicioPreenchido = reservaEdicao?.horario_inicio?.slice(0, 5) || horarioInicial;

    setData(dataPreenchida);
    setMes(
      dataPreenchida
        ? new Date(`${dataPreenchida}T12:00:00`)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );
    setAula(reservaEdicao?.aula ?? false);
    setTurno('manha');
    setPeriodosSelecionados([]);
    setHorarioInicio(inicioPreenchido || '08:00');
    setHorarioFim(
      reservaEdicao?.horario_fim?.slice(0, 5) ||
        (horarioInicial ? horarioFimSugerido(horarioInicial) : '10:00')
    );
    setParticipantes(10);
    setObservacoes(reservaEdicao?.descricao || '');
    setRecorrente(false);
    setTipoRecorrencia(TIPO_RECORRENCIA.SEMANAL);
    setDataFimRecorrencia('');
    setConflitos([]);
    setErro('');
  }, [aberto, areaInicial, reservaEdicao, dataInicial, horarioInicial]);

  const consultaArea = useListaPaginada('/api/areas/', { id: areaId }, aberto && Boolean(areaId));
  const areaSelecionada = consultaArea.itens[0];
  const disponibilidade = useDisponibilidadeReserva({
    tipo: 'AREA', recurso: areaId, mes,
    excluirReserva: reservaEdicao?.id,
  }, aberto && Boolean(areaId));
  const horariosDoDia = disponibilidade.horarios[data] || [];
  const horariosInicioDisponiveis = HORARIOS.filter((horario) => horariosDoDia.includes(horario));
  const horariosFimDisponiveis = HORARIOS.filter(
    (horario) => horario > horarioInicio && intervaloDisponivel(horariosDoDia, horarioInicio, horario)
  );

  function selecionarDataDisponivel(novaData) {
    setData(novaData);
    const primeiro = disponibilidade.horarios[novaData]?.[0] || '';
    setHorarioInicio(primeiro);
    setHorarioFim(primeiro ? horarioFimSugerido(primeiro) : '');
    setPeriodosSelecionados([]);
  }

  function selecionarAreaDisponivel(novoId) {
    setAreaId(novoId);
    setData('');
    setHorarioInicio('');
    setHorarioFim('');
    setPeriodosSelecionados([]);
  }

  function selecionarBloco(novoId) {
    setBlocoId(novoId);
    selecionarAreaDisponivel('');
  }

  // A recorrência só é definida na criação, a edição altera apenas a reserva aberta
  const recorrenciaAtiva = recorrente && !reservaEdicao;
  const quantidadeReservas =
    recorrenciaAtiva && !validarRecorrencia(data, tipoRecorrencia, dataFimRecorrencia)
      ? gerarDatasRecorrencia(data, tipoRecorrencia, dataFimRecorrencia).length
      : 1;

  const periodosDoTurno = PERIODOS_POR_TURNO[turno];
  const indicesSelecionados = periodosSelecionados
    .map((id) => periodosDoTurno.findIndex((periodo) => periodo.id === id))
    .filter((indice) => indice !== -1);
  const horarioInicioAula = indicesSelecionados.length
    ? periodosDoTurno[Math.min(...indicesSelecionados)].inicio
    : '';
  const horarioFimAula = indicesSelecionados.length
    ? periodosDoTurno[Math.max(...indicesSelecionados)].fim
    : '';

  function alterarTurno(novoTurno) {
    setTurno(novoTurno);
    setPeriodosSelecionados([]);
  }

  function alternarPeriodo(id) {
    setPeriodosSelecionados((anteriores) => {
      const marcado = anteriores.includes(id);
      const atualizados = marcado
        ? anteriores.filter((item) => item !== id)
        : [...anteriores, id];

      if (atualizados.length === 0) return atualizados;

      const indices = atualizados
        .map((itemId) => periodosDoTurno.findIndex((periodo) => periodo.id === itemId))
        .filter((indice) => indice !== -1);
      const minIndice = Math.min(...indices);
      const maxIndice = Math.max(...indices);

      return periodosDoTurno.slice(minIndice, maxIndice + 1).map((periodo) => periodo.id);
    });
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErro('');
    setConflitos([]);

    if (!areaId) {
      setErro('Selecione uma área.');
      return;
    }

    if (!data) {
      setErro('Escolha uma data para a reserva.');
      return;
    }

    if (aula && periodosSelecionados.length === 0) {
      setErro('Selecione ao menos um período.');
      return;
    }

    if (!aula && horarioFim <= horarioInicio) {
      setErro('O horário de término deve ser posterior ao de início.');
      return;
    }

    if (participantes < 1 || (areaSelecionada && participantes > areaSelecionada.capacidade)) {
      setErro(
        `Número de participantes acima da capacidade da área (${areaSelecionada?.capacidade} pax).`
      );
      return;
    }

    // O erro da recorrência já é exibido dentro de CamposRecorrencia
    if (recorrenciaAtiva && validarRecorrencia(data, tipoRecorrencia, dataFimRecorrencia)) {
      return;
    }

    try {
      setEnviando(true);

      const dados = {
        nome: titulo.trim(),
        descricao: observacoes.trim(),
        data,
        horario_inicio: aula ? horarioInicioAula : horarioInicio,
        horario_fim: aula ? horarioFimAula : horarioFim,
        area: Number(areaId),
        aula,
      };

      const resultado = reservaEdicao
        ? await atualizarReservaArea(reservaEdicao.id, dados)
        : await criarReservaArea({
            ...dados,
            tipo_reserva: usuario?.perfil_acesso === 'convidado' ? 'EXTERNA' : 'INTERNA',
            recorrencia: montarRecorrencia(
              recorrenciaAtiva,
              tipoRecorrencia,
              dataFimRecorrencia
            ),
          });

      aoReservar(resultado);
    } catch (erroRequisicao) {
      const conflitosRequisicao = conflitosRecorrencia(erroRequisicao);

      setConflitos(conflitosRequisicao);
      setErro(conflitosRequisicao.length ? '' : erroRequisicao.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      aberto={aberto}
      titulo={reservaEdicao ? 'Editar reserva' : 'Reservar área'}
      aoFechar={enviando ? undefined : aoFechar}
    >
      <form
        id="form-reserva-area"
        className="d-flex flex-column gap-3"
        onSubmit={enviar}
      >
        <Alert variant="success" className="d-flex align-items-center gap-2 py-2 mb-0">
          <CheckCircle2 size={16} />
          A reserva será validada ao salvar.
        </Alert>

        <Form.Group>
          <Form.Label>Título</Form.Label>
          <Form.Control
            required
            minLength={5}
            maxLength={50}
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)}
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Bloco</Form.Label>
          <SelectRemoto url="/api/blocos/" ativo={aberto}
            filtros={{ page_size: 100 }} mostrarBusca={false}
            valor={blocoId} aoAlterar={selecionarBloco}
            valorTodos="" rotuloTodos="Selecione um bloco"
            ariaLabel="Bloco" required larguraTotal
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Área</Form.Label>
          <SelectRemoto url="/api/areas/" ativo={aberto && Boolean(blocoId)}
            filtros={{ disponiveis: true, bloco: blocoId, page_size: 100 }} mostrarBusca={false}
            valor={areaId}
            aoAlterar={selecionarAreaDisponivel}
            valorTodos=""
            rotuloTodos="Selecione uma área"
            ariaLabel="Área"
            required
            disabled={!blocoId}
            larguraTotal
          />
        </Form.Group>

        <Form.Group>
          <Form.Label>Escolha um dia disponível</Form.Label>
          <CalendarioReserva
            mes={mes}
            alterarMes={setMes}
            selecionada={data}
            selecionar={selecionarDataDisponivel}
            datasDisponiveis={disponibilidade.diasDisponiveis}
            carregandoDisponibilidade={disponibilidade.carregando}
            erroDisponibilidade={disponibilidade.erro}
          />
        </Form.Group>

        <Form.Check
          type="checkbox"
          id="aula"
          className="border rounded-3 p-3"
          checked={aula}
          onChange={(evento) => setAula(evento.target.checked)}
          label={
            <div>
              <span className="fw-medium">É uma reserva de aula</span>
              <p className="text-muted small mb-0">
                Usa períodos fixos.
              </p>
            </div>
          }
        />

        {aula ? (
          <>
            <Form.Group>
              <Form.Label>Turno</Form.Label>
              <div className="btn-group w-100" role="group" aria-label="Turno">
                {Object.entries(TURNO_LABEL).map(([valorTurno, rotulo]) => (
                  <button
                    key={valorTurno}
                    type="button"
                    className={`btn btn-sm ${
                      turno === valorTurno
                        ? `btn-success ${styles.turnoAtivo}`
                        : 'btn-outline-secondary'
                    }`}
                    onClick={() => alterarTurno(valorTurno)}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
            </Form.Group>

            <Form.Group>
              <Form.Label>Período</Form.Label>
              <div className="row row-cols-2 row-cols-sm-3 g-2">
                {periodosDoTurno.map((periodo) => (
                  <div className="col" key={periodo.id}>
                    <Form.Check
                      type="checkbox"
                      id={`periodo-${periodo.id}`}
                      label={`${periodo.numero}º período (${periodo.inicio}–${periodo.fim})`}
                      checked={periodosSelecionados.includes(periodo.id)}
                      onChange={() => alternarPeriodo(periodo.id)}
                      disabled={!data || !intervaloDisponivel(horariosDoDia, periodo.inicio, periodo.fim)}
                    />
                  </div>
                ))}
              </div>
            </Form.Group>
          </>
        ) : (
          <div className="row g-3">
            <Form.Group className="col-6">
              <Form.Label>Início</Form.Label>
              <Form.Select
                value={horarioInicio}
                onChange={(evento) => setHorarioInicio(evento.target.value)}
              >
                <option value="">Selecione</option>
                {horariosInicioDisponiveis.map((horario) => (
                  <option key={horario} value={horario}>
                    {horario}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="col-6">
              <Form.Label>Término</Form.Label>
              <Form.Select
                value={horarioFim}
                onChange={(evento) => setHorarioFim(evento.target.value)}
              >
                <option value="">Selecione</option>
                {horariosFimDisponiveis.map((horario) => (
                  <option key={horario} value={horario}>
                    {horario}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>
        )}

        {!reservaEdicao && (
          <CamposRecorrencia
            ativa={recorrente}
            aoAlternar={setRecorrente}
            tipo={tipoRecorrencia}
            aoAlterarTipo={setTipoRecorrencia}
            dataFim={dataFimRecorrencia}
            aoAlterarDataFim={setDataFimRecorrencia}
            dataInicio={data}
            conflitos={conflitos}
          />
        )}

        <Form.Group>
          <Form.Label>Número de participantes</Form.Label>
          <Form.Control
            type="number"
            min={1}
            max={areaSelecionada?.capacidade || 999}
            value={participantes}
            onChange={(evento) => setParticipantes(Number(evento.target.value))}
            required
          />
          {areaSelecionada && participantes > areaSelecionada.capacidade && (
            <Form.Text className="text-danger">
              Acima da capacidade da área ({areaSelecionada.capacidade} pax).
            </Form.Text>
          )}
        </Form.Group>

        <Form.Group>
          <Form.Label>Finalidade</Form.Label>
          <Form.Control disabled value={aula ? 'Aula regular' : 'Atividade Acadêmica'} />
        </Form.Group>

        <Form.Group>
          <Form.Label>Observações</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            maxLength={255}
            placeholder="Informações adicionais..."
            value={observacoes}
            onChange={(evento) => setObservacoes(evento.target.value)}
          />
        </Form.Group>

        {erro && (
          <Alert variant="danger" className="py-2 mb-0" role="alert">
            {erro}
          </Alert>
        )}

        <div className={styles.acoes}>
          <Botao
            titulo="Cancelar"
            estilo="secundario"
            aoClicar={aoFechar}
            desabilitado={enviando}
          />

          <Botao
            titulo={
              enviando
                ? 'Salvando...'
                : reservaEdicao
                  ? 'Salvar alterações'
                  : quantidadeReservas > 1
                    ? `Confirmar ${quantidadeReservas} reservas`
                    : 'Confirmar reserva'
            }
            tipo="submit"
            desabilitado={enviando}
          />
        </div>
      </form>
    </Modal>
  );
}

export default ReservaAreaModal;
