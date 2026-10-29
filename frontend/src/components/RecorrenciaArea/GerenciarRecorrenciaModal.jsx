import { useEffect, useState } from 'react';
import { Alert, Form } from 'react-bootstrap';
import { Repeat, Trash2 } from 'lucide-react';
import Modal from '../Administracao/Modal/Modal';
import ModalConfirmacao from '../Administracao/ModalConfirmacao/ModalConfirmacao';
import Botao from '../Botao/Botao';
import Select from '../Select/Select';
import {
  atualizarRecorrenciaArea,
  buscarRecorrenciaArea,
  cancelarRecorrenciaArea,
} from '../../services/reservasAreas';
import { TURNO_LABEL, PERIODOS_POR_TURNO } from '../../utils/periodosAula';
import { dataParaISO, formatarDataCurta } from '../../utils/data';
import { TIPO_RECORRENCIA_LABEL, conflitosRecorrencia } from '../../utils/recorrencia';
import {
  HORARIOS,
  ajustarPeriodosContiguos,
  gruposAreaPorBloco,
  horarioDosPeriodos,
  periodosDoHorario,
} from '../../utils/reservaArea';
import styles from './GerenciarRecorrenciaModal.module.css';

/**
 * Exemplo de uso:
 * <GerenciarRecorrenciaModal
 *   aberto
 *   recorrenciaId={reserva.recorrencia.id}
 *   areas={areas}
 *   blocos={blocos}
 *   aoFechar={() => setRecorrencia(null)}
 *   aoSalvar={(dados) => atualizar(dados)}
 *   aoCancelarRecorrencia={(dados) => atualizar(dados)}
 * />
 *
 * Props:
 * - aberto: indica se o modal está visível
 * - recorrenciaId: id da recorrência gerenciada
 * - areas / blocos: listas usadas no seletor de área
 * - aoFechar: função chamada ao fechar sem alterar nada
 * - aoSalvar: função chamada com a resposta do backend ({ recorrencia, reservas }) após editar
 * - aoCancelarRecorrencia: função chamada com a resposta do backend após cancelar as reservas
 */

// Mesmo critério do backend: apenas reservas confirmadas que ainda não começaram
function reservasAlteraveis(reservas) {
  const agora = new Date();
  const momentoAtual = `${dataParaISO(agora)} ${agora.toTimeString().slice(0, 5)}`;

  return reservas.filter(
    (reserva) =>
      reserva.status === 'CONFIRMADA' &&
      `${reserva.data} ${reserva.horario_inicio.slice(0, 5)}` > momentoAtual
  );
}

function camposEditaveis(reserva) {
  return {
    nome: reserva.nome,
    descricao: reserva.descricao || '',
    horario_inicio: reserva.horario_inicio.slice(0, 5),
    horario_fim: reserva.horario_fim.slice(0, 5),
    area: Number(reserva.area),
    aula: Boolean(reserva.aula),
  };
}

function GerenciarRecorrenciaModal({
  aberto,
  recorrenciaId,
  areas = [],
  blocos = [],
  aoFechar,
  aoSalvar,
  aoCancelarRecorrencia,
}) {
  const [recorrencia, setRecorrencia] = useState(null);
  const [alteraveis, setAlteraveis] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [areaId, setAreaId] = useState('');
  const [aula, setAula] = useState(false);
  const [turno, setTurno] = useState('manha');
  const [periodosSelecionados, setPeriodosSelecionados] = useState([]);
  const [horarioInicio, setHorarioInicio] = useState('08:00');
  const [horarioFim, setHorarioFim] = useState('10:00');
  const [observacoes, setObservacoes] = useState('');
  const [conflitos, setConflitos] = useState([]);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!aberto || !recorrenciaId) return;

    let descartada = false;

    buscarRecorrenciaArea(recorrenciaId)
      .then((dados) => {
        if (descartada) return;

        const lista = reservasAlteraveis(dados.reservas);
        const referencia = lista[0];

        setRecorrencia(dados.recorrencia);
        setAlteraveis(lista);

        if (!referencia) return;

        const periodos = referencia.aula
          ? periodosDoHorario(referencia.horario_inicio.slice(0, 5), referencia.horario_fim.slice(0, 5))
          : null;

        setTitulo(referencia.nome);
        setAreaId(String(referencia.area));
        setAula(Boolean(referencia.aula));
        setTurno(periodos?.turno || 'manha');
        setPeriodosSelecionados(periodos?.ids || []);
        setHorarioInicio(referencia.horario_inicio.slice(0, 5));
        setHorarioFim(referencia.horario_fim.slice(0, 5));
        setObservacoes(referencia.descricao || '');
      })
      .catch((falha) => {
        if (!descartada) setErro(falha.message);
      })
      .finally(() => {
        if (!descartada) setCarregando(false);
      });

    return () => {
      descartada = true;
    };
  }, [aberto, recorrenciaId]);

  const referencia = alteraveis[0];
  const gruposArea = gruposAreaPorBloco(areas, blocos);
  const periodosDoTurno = PERIODOS_POR_TURNO[turno];
  const horarioAula = horarioDosPeriodos(periodosSelecionados, periodosDoTurno);

  const dadosRecorrencia = {
    nome: titulo.trim(),
    descricao: observacoes.trim(),
    horario_inicio: aula ? horarioAula.inicio : horarioInicio,
    horario_fim: aula ? horarioAula.fim : horarioFim,
    area: Number(areaId),
    aula,
  };

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

      return ajustarPeriodosContiguos(atualizados, periodosDoTurno);
    });
  }

  async function salvar(evento) {
    evento.preventDefault();
    setErro('');
    setConflitos([]);

    if (!areaId) {
      setErro('Selecione uma área.');
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

    // O backend aceita apenas os campos editáveis e recusa o envio sem alterações
    const originais = camposEditaveis(referencia);
    const alterados = Object.fromEntries(
      Object.entries(dadosRecorrencia).filter(([campo, valor]) => valor !== originais[campo])
    );

    if (Object.keys(alterados).length === 0) {
      setErro('Nenhuma alteração para salvar.');
      return;
    }

    try {
      setEnviando(true);
      aoSalvar(await atualizarRecorrenciaArea(recorrenciaId, alterados));
    } catch (erroRequisicao) {
      const conflitosEdicao = conflitosRecorrencia(erroRequisicao);

      if (conflitosEdicao.length) {
        setConflitos(conflitosEdicao);
      } else {
        setErro(erroRequisicao.message);
      }
    } finally {
      setEnviando(false);
    }
  }

  async function cancelarReservas() {
    if (enviando) return;

    try {
      setEnviando(true);
      setErro('');
      aoCancelarRecorrencia(await cancelarRecorrenciaArea(recorrenciaId));
    } catch (erroRequisicao) {
      setErro(erroRequisicao.message);
    } finally {
      setEnviando(false);
    }
  }

  if (confirmando) {
    return (
      <ModalConfirmacao
        aberto={aberto}
        titulo="Cancelar recorrência?"
        mensagem={`Tem certeza que deseja cancelar as ${alteraveis.length} reserva(s) futuras de "${referencia?.nome}"? Esta ação não pode ser desfeita.`}
        aviso={erro}
        textoConfirmar={enviando ? 'Cancelando...' : 'Confirmar'}
        aoCancelar={() => {
          if (enviando) return;
          setConfirmando(false);
          setErro('');
        }}
        aoConfirmar={cancelarReservas}
      />
    );
  }

  return (
    <Modal
      aberto={aberto}
      titulo="Gerenciar recorrência"
      aoFechar={aoFechar}
      processando={enviando}
    >
      {carregando ? (
        <p className="text-muted mb-0" role="status">Carregando recorrência...</p>
      ) : !recorrencia ? (
        <Alert variant="danger" className="py-2 mb-0" role="alert">
          {erro || 'Não foi possível carregar a recorrência.'}
        </Alert>
      ) : !referencia ? (
        <Alert variant="warning" className="py-2 mb-0">
          Não há reservas futuras confirmadas nesta recorrência.
        </Alert>
      ) : (
        <form className="d-flex flex-column gap-3" onSubmit={salvar}>
          <Alert variant="success" className="d-flex align-items-start gap-2 py-2 mb-0">
            <Repeat size={16} className="flex-shrink-0 mt-1" />
            <div>
              <span className="fw-medium">
                {TIPO_RECORRENCIA_LABEL[recorrencia.tipo] || recorrencia.tipo} · de{' '}
                {formatarDataCurta(recorrencia.data_inicio)} a {formatarDataCurta(recorrencia.data_fim)}
              </span>
              <p className="small mb-0">
                As alterações serão aplicadas às {alteraveis.length} reserva(s) futuras confirmadas.
              </p>
            </div>
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
            <Form.Label>Área</Form.Label>
            <Select
              valor={areaId}
              aoAlterar={setAreaId}
              grupos={gruposArea}
              valorTodos=""
              rotuloTodos="Selecione uma área"
              ariaLabel="Área"
              required
              larguraTotal
            />
          </Form.Group>

          <Form.Check
            type="checkbox"
            id="recorrencia-aula"
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
                        id={`recorrencia-periodo-${periodo.id}`}
                        label={`${periodo.numero}º período (${periodo.inicio}–${periodo.fim})`}
                        checked={periodosSelecionados.includes(periodo.id)}
                        onChange={() => alternarPeriodo(periodo.id)}
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
                  {HORARIOS.map((horario) => (
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
                  {HORARIOS.map((horario) => (
                    <option key={horario} value={horario}>
                      {horario}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
          )}

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

          {conflitos.length > 0 && (
            <Alert variant="danger" className="py-2 mb-0" role="alert">
              <p className="fw-medium mb-1">Não foi possível alterar a recorrência:</p>
              <ul className="small mb-0 ps-3">
                {conflitos.map((conflito) => (
                  <li key={conflito}>{conflito}</li>
                ))}
              </ul>
            </Alert>
          )}

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
              titulo={enviando ? 'Salvando...' : 'Salvar alterações'}
              tipo="submit"
              desabilitado={enviando}
            />
          </div>

          <div className="d-grid border-top pt-3">
            <Botao
              titulo={`Cancelar ${alteraveis.length} reserva(s) da recorrência`}
              icone={Trash2}
              estilo="perigo"
              aoClicar={() => {
                setErro('');
                setConflitos([]);
                setConfirmando(true);
              }}
              desabilitado={enviando}
            />
          </div>
        </form>
      )}
    </Modal>
  );
}

export default GerenciarRecorrenciaModal;
