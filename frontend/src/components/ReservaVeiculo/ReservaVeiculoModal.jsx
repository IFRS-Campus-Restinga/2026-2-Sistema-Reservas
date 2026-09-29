/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock3 } from 'lucide-react';

import Modal from '../Administracao/Modal/Modal';
import Botao from '../Botao/Botao';
import CalendarioReserva from '../CalendarioReserva/CalendarioReserva';
import {
  atualizarReservaVeiculo,
  consultarDisponibilidadeVeiculo,
  criarReservaVeiculo,
} from '../../services/reservasVeiculos';
import { STATUS_RECURSO_LABEL } from '../../utils/statusRecurso';
import styles from './ReservaVeiculoModal.module.css';

const HORARIOS = Array.from({ length: 48 }, (_, indice) => {
  const horas = String(Math.floor(indice / 2)).padStart(2, '0');
  const minutos = indice % 2 ? '30' : '00';
  return `${horas}:${minutos}`;
});

function hojeISO() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function horarioEhFuturo(data, horario) {
  if (!data || !horario) return false;
  return new Date(`${data}T${horario}:00`) > new Date();
}

function opcoesHorario(data, valorAtual = '') {
  const hoje = hojeISO();
  const filtradas = data === hoje
    ? HORARIOS.filter((horario) => horarioEhFuturo(data, horario))
    : HORARIOS;

  return valorAtual && !filtradas.includes(valorAtual)
    ? [valorAtual, ...filtradas].sort()
    : filtradas;
}

function ReservaVeiculoModal({
  aberto,
  veiculoInicial,
  veiculos = [],
  reservaEdicao,
  aoFechar,
  aoReservar,
}) {
  const [veiculoId, setVeiculoId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState('');
  const [dataRetorno, setDataRetorno] = useState('');
  const [mesSaida, setMesSaida] = useState(new Date());
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  const [destino, setDestino] = useState('');
  const [finalidade, setFinalidade] = useState('');
  const [ocupantes, setOcupantes] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [disponivel, setDisponivel] = useState(null);
  const [erro, setErro] = useState('');
  const consultaAtual = useRef(0);

  useEffect(() => {
    if (!aberto) return;

    const saida = reservaEdicao?.data || '';
    const retorno = reservaEdicao?.data_devolucao_prevista || '';
    setVeiculoId(String(reservaEdicao?.veiculo || veiculoInicial?.id || ''));
    setTitulo(reservaEdicao?.nome || '');
    setDescricao(reservaEdicao?.descricao || '');
    setData(saida);
    setDataRetorno(retorno);
    setMesSaida(saida ? new Date(`${saida}T12:00:00`) : new Date());
    setHorarioInicio(reservaEdicao?.horario_inicio?.slice(0, 5) || '');
    setHorarioFim(reservaEdicao?.horario_fim?.slice(0, 5) || '');
    setDestino(reservaEdicao?.destino || '');
    setFinalidade(reservaEdicao?.finalidade || '');
    setOcupantes(reservaEdicao?.quantidade_passageiros || 1);
    setDisponivel(null);
    setErro('');
  }, [aberto, veiculoInicial, reservaEdicao]);

  const veiculo = veiculos.find((item) => String(item.id) === veiculoId) || veiculoInicial;
  const intervaloCompleto = Boolean(
    veiculoId && data && dataRetorno && horarioInicio && horarioFim &&
    new Date(`${dataRetorno}T${horarioFim}:00`) > new Date(`${data}T${horarioInicio}:00`)
  );

  useEffect(() => {
    if (!aberto || !intervaloCompleto) {
      return;
    }

    const numeroConsulta = ++consultaAtual.current;
    const temporizador = window.setTimeout(async () => {
      setVerificando(true);
      setDisponivel(null);
      try {
        await consultarDisponibilidadeVeiculo({
          veiculo: veiculoId,
          data,
          horario_inicio: horarioInicio,
          data_devolucao_prevista: dataRetorno,
          horario_fim: horarioFim,
          ...(reservaEdicao ? { excluir_reserva: reservaEdicao.id } : {}),
        });
        if (numeroConsulta === consultaAtual.current) {
          setDisponivel(true);
          setErro('');
        }
      } catch (falha) {
        if (numeroConsulta === consultaAtual.current) {
          setDisponivel(false);
          setErro(falha.message);
        }
      } finally {
        if (numeroConsulta === consultaAtual.current) setVerificando(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(temporizador);
      consultaAtual.current += 1;
    };
  }, [aberto, intervaloCompleto, veiculoId, data, horarioInicio, dataRetorno,
      horarioFim, reservaEdicao]);

  function escolherData(novaData) {
    setDisponivel(null);
    setErro('');

    if (!data || dataRetorno) {
      setData(novaData);
      setDataRetorno('');
      setHorarioInicio('');
      setHorarioFim('');
      return;
    }

    if (novaData < data) {
      setData(novaData);
      setHorarioInicio('');
      return;
    }

    setDataRetorno(novaData);
    setHorarioFim('');
  }

  const horariosSaida = opcoesHorario(data, reservaEdicao?.data === data ? horarioInicio : '');
  const horariosRetorno = opcoesHorario(
    dataRetorno,
    reservaEdicao?.data_devolucao_prevista === dataRetorno ? horarioFim : ''
  ).filter((horario) => dataRetorno !== data || horario > horarioInicio);

  async function enviar(evento) {
    evento.preventDefault();
    setErro('');

    if (!intervaloCompleto) {
      setErro('Informe uma saída e um retorno válidos.');
      return;
    }
    if (!reservaEdicao && !horarioEhFuturo(data, horarioInicio)) {
      setErro('O horário de retirada deve ser futuro.');
      return;
    }
    if (!veiculo || ocupantes < 1 || ocupantes > veiculo.capacidade) {
      setErro(`Informe de 1 a ${veiculo?.capacidade || 1} ocupantes, incluindo o motorista.`);
      return;
    }

    const dadosIntervalo = {
      veiculo: veiculoId,
      data,
      horario_inicio: horarioInicio,
      data_devolucao_prevista: dataRetorno,
      horario_fim: horarioFim,
      ...(reservaEdicao ? { excluir_reserva: reservaEdicao.id } : {}),
    };

    try {
      setEnviando(true);
      await consultarDisponibilidadeVeiculo(dadosIntervalo);

      const dados = {
        nome: titulo.trim(),
        descricao: descricao.trim(),
        veiculo: Number(veiculoId),
        data,
        horario_inicio: horarioInicio,
        data_devolucao_prevista: dataRetorno,
        horario_fim: horarioFim,
        destino: destino.trim(),
        finalidade: finalidade.trim(),
        quantidade_passageiros: Number(ocupantes),
      };
      const resultado = reservaEdicao
        ? await atualizarReservaVeiculo(reservaEdicao.id, dados)
        : await criarReservaVeiculo(dados);
      aoReservar(resultado);
    } catch (falha) {
      setDisponivel(false);
      setErro(falha.message);
    } finally {
      setEnviando(false);
    }
  }

  if (!veiculoInicial && !reservaEdicao) return null;

  const opcoesVeiculos = veiculos.filter((item) =>
    item.status === 'ATIVO' || String(item.id) === veiculoId
  );

  return (
    <Modal
      aberto={aberto}
      titulo={reservaEdicao ? 'Editar reserva de veículo' : 'Reservar veículo'}
      aoFechar={enviando ? undefined : aoFechar}
    >
      <form className={styles.formulario} onSubmit={enviar}>
        <div className={styles.aviso}>
          <CheckCircle2 size={16} />
          A disponibilidade será confirmada ao salvar.
        </div>

        <label>
          Título
          <input required minLength={5} maxLength={50} value={titulo}
            onChange={(evento) => setTitulo(evento.target.value)} />
        </label>

        <label>
          Veículo
          <select required value={veiculoId} onChange={(evento) => {
            setVeiculoId(evento.target.value);
            setDisponivel(null);
          }}>
            {opcoesVeiculos.map((item) => (
              <option key={item.id} value={item.id} disabled={item.status !== 'ATIVO'}>
                {item.nome} · {item.placa}{item.status !== 'ATIVO' ? ` (${STATUS_RECURSO_LABEL[item.status]})` : ''}
              </option>
            ))}
          </select>
        </label>

        <div className={styles.campo}>
          <span>Período da reserva</span>
          <CalendarioReserva
            mes={mesSaida}
            alterarMes={setMesSaida}
            selecionada={dataRetorno || data}
            selecionar={escolherData}
            inicioPeriodo={data}
            fimPeriodo={dataRetorno}
          />
          <small>
            {!data
              ? 'Selecione a data de retirada.'
              : !dataRetorno
                ? 'Agora selecione a data de retorno.'
                : `Retirada em ${data.split('-').reverse().join('/')} e retorno em ${dataRetorno.split('-').reverse().join('/')}. Clique em outra data para escolher um novo período.`}
          </small>
        </div>

        <div className={styles.horarios}>
          <label>
            Horário de retirada
            <select required value={horarioInicio} onChange={(evento) => {
              setHorarioInicio(evento.target.value);
              setDisponivel(null);
            }}>
              <option value="">Selecione</option>
              {horariosSaida.map((horario) => <option key={horario}>{horario}</option>)}
            </select>
          </label>
          <label>
            Horário de retorno
            <select required value={horarioFim} onChange={(evento) => {
              setHorarioFim(evento.target.value);
              setDisponivel(null);
            }}>
              <option value="">Selecione</option>
              {horariosRetorno.map((horario) => <option key={horario}>{horario}</option>)}
            </select>
          </label>
        </div>

        {intervaloCompleto && (
          <p className={`${styles.disponibilidade} ${disponivel === false ? styles.indisponivel : ''}`}>
            <Clock3 size={15} />
            {verificando
              ? 'Verificando disponibilidade...'
              : disponivel
                ? 'Veículo disponível no período selecionado.'
                : 'Revise a disponibilidade do período.'}
          </p>
        )}

        <label>
          Destino
          <input required maxLength={50} value={destino}
            onChange={(evento) => setDestino(evento.target.value)} />
        </label>
        <label>
          Finalidade
          <input required maxLength={255} value={finalidade}
            placeholder="Ex.: Visita técnica"
            onChange={(evento) => setFinalidade(evento.target.value)} />
        </label>
        <label>
          Ocupantes, incluindo motorista
          <input required type="number" min={1} max={veiculo?.capacidade || 1}
            value={ocupantes} onChange={(evento) => setOcupantes(Number(evento.target.value))} />
          <small>Capacidade do veículo: {veiculo?.capacidade || 0} pessoas.</small>
        </label>
        <label>
          Observações
          <textarea rows={3} maxLength={255} value={descricao}
            placeholder="Informações adicionais..."
            onChange={(evento) => setDescricao(evento.target.value)} />
        </label>

        {erro && <p className={styles.erro} role="alert">{erro}</p>}

        <div className={styles.acoes}>
          <Botao titulo="Cancelar" estilo="secundario" aoClicar={aoFechar} desabilitado={enviando} />
          <Botao tipo="submit" desabilitado={enviando || verificando}
            titulo={enviando ? 'Salvando...' : reservaEdicao ? 'Salvar alterações' : 'Confirmar reserva'} />
        </div>
      </form>
    </Modal>
  );
}

export default ReservaVeiculoModal;
