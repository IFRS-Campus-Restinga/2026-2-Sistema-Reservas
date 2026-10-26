/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

import Modal from '../Administracao/Modal/Modal';
import Botao from '../Botao/Botao';
import CalendarioReserva from '../CalendarioReserva/CalendarioReserva';
import {
  criarReservaRecursoGeral,
  atualizarReservaRecursoGeral,
  consultarDisponibilidadeRecursoGeral,
} from '../../services/reservasRecursosGerais';
import { TIPO_PRAZO_LABEL } from '../../utils/tipoPrazo';
import styles from './ReservaRecursoGeralModal.module.css';

const HORARIOS = Array.from({ length: 29 }, (_, indice) => {
  const total = 7 * 60 + indice * 30;
  const horas = String(Math.floor(total / 60)).padStart(2, '0');
  const minutos = String(total % 60).padStart(2, '0');

  return `${horas}:${minutos}`;
});

function ReservaRecursoGeralModal({
  aberto,
  tipo,
  recursoInicial,
  tipos = [],
  recursos = [],
  reservaEdicao,
  aoFechar,
  aoReservar,
}) {
  const [tipoId, setTipoId] = useState('');
  const [recursoId, setRecursoId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState('');
  const [mes, setMes] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [horarioInicio, setHorarioInicio] = useState('08:00');
  const [horarioFim, setHorarioFim] = useState('10:00');
  const [quantidade, setQuantidade] = useState(1);
  const [dataDevolucao, setDataDevolucao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [disponiveisPeriodo, setDisponiveisPeriodo] = useState(null);
  const [verificando, setVerificando] = useState(false);

  const tiposComRecursos = tipos.length > 0
    ? tipos.map((itemTipo) => ({
        ...itemTipo,
        recursos: recursos.filter(
          (recurso) => String(recurso.tipo_recurso) === String(itemTipo.id)
        ),
      }))
    : tipo
      ? [tipo]
      : [];

  const tiposDisponiveis = tiposComRecursos.filter((itemTipo) =>
    itemTipo.recursos?.some(
      (recurso) =>
        recurso.status === 'ATIVO' &&
        Number(recurso.quantidade_total) > 0
    )
  );

  useEffect(() => {
    if (!aberto) return;

    const tipoInicialId = tipo?.id ||
      tiposComRecursos.find((itemTipo) =>
        itemTipo.recursos?.some(
          (recurso) => String(recurso.id) === String(recursoInicial?.id)
        )
      )?.id || '';

    setTipoId(String(tipoInicialId));
    setRecursoId(String(recursoInicial?.id || ''));
    setTitulo(reservaEdicao?.nome || '');
    setDescricao(reservaEdicao?.descricao || '');
    setData(reservaEdicao?.data || '');
    setMes(
      reservaEdicao?.data
        ? new Date(`${reservaEdicao.data}T12:00:00`)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );
    setHorarioInicio(reservaEdicao?.horario_inicio?.slice(0, 5) || '08:00');
    setHorarioFim(reservaEdicao?.horario_fim?.slice(0, 5) || '10:00');
    setQuantidade(reservaEdicao?.quantidades || 1);
    setDataDevolucao(reservaEdicao?.data_devolucao_prevista || '');
    setDisponiveisPeriodo(null);
    setErro('');
  }, [aberto, tipo, recursoInicial, reservaEdicao]);

  const tipoSelecionado = tiposComRecursos.find(
    (itemTipo) => String(itemTipo.id) === String(tipoId)
  ) || tipo;

  const opcoes = (tipoSelecionado?.recursos || []).filter(
    (recurso) =>
      recurso.status === 'ATIVO' &&
      (
        Number(recurso.quantidade_total) > 0 ||
        (
          reservaEdicao &&
          String(recurso.id) === String(recursoInicial?.id)
        )
      )
  );

  const recurso = opcoes.find(
    (item) => String(item.id) === String(recursoId)
  ) || recursoInicial;

  const prazoLongo = recurso?.tipo_prazo === 'LONGO_PRAZO';
  const devolucaoEscolhida = prazoLongo ? dataDevolucao : data;
  const periodoValido = Boolean(
    aberto && recurso && data && devolucaoEscolhida &&
    devolucaoEscolhida >= data &&
    (devolucaoEscolhida > data || horarioFim > horarioInicio)
  );

  useEffect(() => {
    if (!periodoValido) {
      setDisponiveisPeriodo(null);
      setVerificando(false);
      return;
    }

    let ativo = true;
    setVerificando(true);
    setDisponiveisPeriodo(null);

    consultarDisponibilidadeRecursoGeral({
      recurso_geral: recurso.id,
      data,
      horario_inicio: horarioInicio,
      horario_fim: horarioFim,
      data_devolucao_prevista: devolucaoEscolhida,
      ...(reservaEdicao ? { excluir_reserva: reservaEdicao.id } : {}),
    })
      .then((resultado) => {
        if (ativo) setDisponiveisPeriodo(resultado.disponiveis);
      })
      .catch((falha) => {
        if (ativo) {
          setErro(
            falha.message || 'Não foi possível consultar a disponibilidade.'
          );
        }
      })
      .finally(() => {
        if (ativo) setVerificando(false);
      });

    return () => {
      ativo = false;
    };
  }, [
    periodoValido,
    recurso?.id,
    data,
    horarioInicio,
    horarioFim,
    devolucaoEscolhida,
    reservaEdicao?.id,
  ]);

  const limite = recurso
    ? (disponiveisPeriodo ?? Number(recurso.quantidade_total))
    : 0;

  function selecionarTipo(id) {
    setTipoId(id);
    setRecursoId('');
    setQuantidade(1);
    setDataDevolucao('');
    setDisponiveisPeriodo(null);
    setErro('');
  }

  function selecionarRecurso(id) {
    setRecursoId(id);
    setQuantidade(1);
    setDataDevolucao('');
    setDisponiveisPeriodo(null);
    setErro('');
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErro('');

    if (!tipoSelecionado) {
      setErro('Selecione um tipo de recurso.');
      return;
    }

    if (!recurso) {
      setErro('Selecione um recurso.');
      return;
    }

    if (!data) {
      setErro('Escolha uma data para a reserva.');
      return;
    }

    if (prazoLongo && (!dataDevolucao || dataDevolucao < data)) {
      setErro('Informe uma data de devolução igual ou posterior à retirada.');
      return;
    }

    if ((prazoLongo ? dataDevolucao === data : true) && horarioFim <= horarioInicio) {
      setErro('O horário de devolução deve ser posterior ao de retirada no mesmo dia.');
      return;
    }

    if (quantidade < 1 || quantidade > limite) {
      setErro('A quantidade solicitada não está disponível.');
      return;
    }

    try {
      setEnviando(true);

      const dados = {
        nome: titulo.trim(),
        descricao: descricao.trim(),
        data,
        horario_inicio: horarioInicio,
        horario_fim: horarioFim,
        recurso_geral: recurso.id,
        data_devolucao_prevista: prazoLongo ? dataDevolucao : data,
        quantidades: Number(quantidade),
      };

      const resultado = reservaEdicao
        ? await atualizarReservaRecursoGeral(reservaEdicao.id, dados)
        : await criarReservaRecursoGeral({
            ...dados,
            tipo_reserva: 'INTERNA',
          });

      aoReservar(resultado);
    } catch (erroRequisicao) {
      setErro(erroRequisicao.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      aberto={aberto}
      titulo={reservaEdicao ? 'Editar reserva' : 'Reservar recurso'}
      aoFechar={enviando ? undefined : aoFechar}
    >
      <form
        id="form-reserva-recurso-geral"
        className={styles.formulario}
        onSubmit={enviar}
      >
        <div className={styles.aviso}>
          <CheckCircle2 size={16} />
          A reserva será validada ao salvar.
        </div>

        <label>
          Título
          <input
            required
            maxLength={50}
            minLength={5}
            value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)}
          />
        </label>

        {tipos.length > 0 ? (
          <label>
            Tipo de recurso
            <select
              required
              value={tipoId}
              onChange={(evento) => selecionarTipo(evento.target.value)}
            >
              <option value="">Selecione um tipo</option>
              {tiposDisponiveis.map((itemTipo) => (
                <option key={itemTipo.id} value={itemTipo.id}>
                  {itemTipo.descricao}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            Tipo de recurso
            <input
              disabled
              value={
                tipoSelecionado && recurso
                  ? `${tipoSelecionado.descricao} · ${
                      TIPO_PRAZO_LABEL[recurso.tipo_prazo] || recurso.tipo_prazo
                    }`
                  : ''
              }
            />
          </label>
        )}

        <label>
          Item específico
          <select
            required
            value={recursoId}
            onChange={(evento) => selecionarRecurso(evento.target.value)}
            disabled={!tipoSelecionado}
          >
            <option value="">Selecione um recurso</option>
            {opcoes.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.nome} · {item.quantidade_total} unidade(s)
              </option>
            ))}
          </select>
        </label>

        {recurso && (
          <small>
            {TIPO_PRAZO_LABEL[recurso.tipo_prazo] || recurso.tipo_prazo}
          </small>
        )}

        <div className={styles.campo}>
          <span>Escolha um dia disponível</span>

          <CalendarioReserva
            mes={mes}
            alterarMes={setMes}
            selecionada={data}
            selecionar={setData}
          />
        </div>

        <div className={styles.horarios}>
          <label>
            Horário de retirada
            <select
              value={horarioInicio}
              onChange={(evento) => setHorarioInicio(evento.target.value)}
            >
              {HORARIOS.map((horario) => (
                <option key={horario} value={horario}>
                  {horario}
                </option>
              ))}
            </select>
          </label>

          <label>
            Horário de devolução
            <select
              value={horarioFim}
              onChange={(evento) => setHorarioFim(evento.target.value)}
            >
              {HORARIOS.map((horario) => (
                <option key={horario} value={horario}>
                  {horario}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Quantidade
          <input
            type="number"
            min={1}
            max={limite || 1}
            value={quantidade}
            onChange={(evento) => setQuantidade(Number(evento.target.value))}
            required
            disabled={!recurso}
          />

          {recurso && (
            <small>
              {verificando
                ? 'Verificando disponibilidade...'
                : `${limite} unidade(s) disponível(is) no período.`}
            </small>
          )}
        </label>

        {prazoLongo && (
          <label>
            Data de devolução prevista *
            <input
              type="date"
              min={data || undefined}
              value={dataDevolucao}
              onChange={(evento) => setDataDevolucao(evento.target.value)}
              required
            />
          </label>
        )}

        <label>
          Observações
          <textarea
            maxLength={255}
            placeholder="Informações adicionais..."
            rows={3}
            value={descricao}
            onChange={(evento) => setDescricao(evento.target.value)}
          />
        </label>

        {recurso?.tem_termo_de_responsabilidade && (
          <p className={styles.termo}>
            Este recurso exige termo de responsabilidade.
          </p>
        )}

        {erro && (
          <p className={styles.erro} role="alert">
            {erro}
          </p>
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

export default ReservaRecursoGeralModal;
