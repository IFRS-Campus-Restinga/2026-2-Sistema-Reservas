
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
  reservaEdicao,
  aoFechar,
  aoReservar,
}) {
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

  useEffect(() => {
    if (!aberto || !recursoInicial) return;

    setRecursoId(String(recursoInicial.id));
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
    setErro('');
  }, [aberto, recursoInicial, reservaEdicao]);

  const recursoEscolhido = tipo?.recursos.find(
    (item) => String(item.id) === recursoId
  ) || recursoInicial;
  const prazoLongo = recursoEscolhido?.tipo_prazo === 'LONGO_PRAZO';
  const devolucaoEscolhida = prazoLongo ? dataDevolucao : data;
  const periodoValido = Boolean(
    aberto && recursoEscolhido && data && devolucaoEscolhida &&
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
      recurso_geral: recursoEscolhido.id,
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
        if (ativo) setErro(falha.message || 'Não foi possível consultar a disponibilidade.');
      })
      .finally(() => {
        if (ativo) setVerificando(false);
      });
    return () => { ativo = false; };
  }, [periodoValido, recursoEscolhido?.id, data, horarioInicio, horarioFim,
      devolucaoEscolhida, reservaEdicao?.id]);

  if (!tipo || !recursoInicial) return null;

  const opcoes = tipo.recursos.filter(
    (recurso) =>
      recurso.status === 'ATIVO' &&
      (
        Number(recurso.quantidade_total) > 0 ||
        (
          reservaEdicao &&
          String(recurso.id) === String(recursoInicial.id)
        )
      )
  );


  const recurso =
    opcoes.find((item) => String(item.id) === recursoId) || recursoInicial;

  const limite = disponiveisPeriodo ?? Number(recurso.quantidade_total);

  const longoPrazo = recurso.tipo_prazo === 'LONGO_PRAZO';


  function selecionarRecurso(id) {
    const escolhido = opcoes.find((item) => String(item.id) === id);

    if (!escolhido) return;

    setRecursoId(id);
    setQuantidade(1);
    setDataDevolucao('');
    setErro('');
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErro('');

    if (!data) {
      setErro('Escolha uma data para a reserva.');
      return;
    }

    if (longoPrazo && (!dataDevolucao || dataDevolucao < data)) {
      setErro('Informe uma data de devolução igual ou posterior à retirada.');
      return;
    }

    if ((longoPrazo ? dataDevolucao === data : true) && horarioFim <= horarioInicio) {
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
        data_devolucao_prevista: longoPrazo ? dataDevolucao : data,
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

        <label>
          Tipo de recurso
          <input
            disabled
            value={`${tipo.descricao} · ${
              TIPO_PRAZO_LABEL[recurso.tipo_prazo] || recurso.tipo_prazo
            }`}
          />
        </label>

        <label>
          Item específico
          <select
            value={String(recurso.id)}
            onChange={(evento) => selecionarRecurso(evento.target.value)}
          >
            {opcoes.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.nome} · {item.quantidade_total} unidade(s)
              </option>
            ))}
          </select>
        </label>

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
            max={limite}
            value={quantidade}
            onChange={(evento) => setQuantidade(Number(evento.target.value))}
            required
          />

          <small>
            {limite} unidade(s) disponível(is) no cadastro. A disponibilidade
            da data será validada ao salvar.
          </small>
        </label>

        {longoPrazo && (
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
          Finalidade
          <input disabled value="Empréstimo de recurso" />
        </label>

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

        {recurso.tem_termo_de_responsabilidade && (
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
