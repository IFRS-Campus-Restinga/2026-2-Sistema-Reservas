import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-bootstrap';
import { Repeat, Trash2 } from 'lucide-react';
import Modal from '../Administracao/Modal/Modal';
import ModalConfirmacao from '../Administracao/ModalConfirmacao/ModalConfirmacao';
import Botao from '../Botao/Botao';
import SelectRemoto from '../SelectRemoto/SelectRemoto';
import useListaPaginada from '../../hooks/useListaPaginada';
import {
  atualizarRecorrenciaVeiculo,
  buscarRecorrenciaVeiculo,
  cancelarRecorrenciaVeiculo,
} from '../../services/reservasVeiculos';
import { formatarDataCurta } from '../../utils/data';
import {
  TIPO_RECORRENCIA_LABEL,
  camposAlterados,
  conflitosRecorrencia,
} from '../../utils/recorrencia';
import AlertBanner from '../AlertBanner/AlertBanner';
import { mensagemDeErro } from '../../utils/erros';
import styles from './GerenciarRecorrenciaVeiculoModal.module.css';

/**
 * Exemplo de uso:
 * <GerenciarRecorrenciaVeiculoModal
 *   aberto
 *   recorrenciaId={reserva.recorrencia.id}
 *   aoFechar={() => setRecorrencia(null)}
 *   aoSalvar={(dados) => atualizar(dados)}
 *   aoCancelarRecorrencia={(dados) => atualizar(dados)}
 * />
 *
 * Props:
 * - aberto: indica se o modal está visível
 * - recorrenciaId: id da recorrência gerenciada
 * - aoFechar: função chamada ao fechar sem alterar nada
 * - aoSalvar: função chamada com a resposta do backend ({ recorrencia, reservas, alteraveis }) após editar
 * - aoCancelarRecorrencia: função chamada com a resposta do backend após cancelar as reservas
 */

const HORARIOS = Array.from({ length: 48 }, (_, indice) => {
  const horas = String(Math.floor(indice / 2)).padStart(2, '0');
  const minutos = indice % 2 ? '30' : '00';
  return `${horas}:${minutos}`;
});

function camposEditaveis(reserva) {
  return {
    nome: reserva.nome,
    descricao: reserva.descricao || '',
    veiculo: Number(reserva.veiculo),
    horario_inicio: reserva.horario_inicio.slice(0, 5),
    horario_fim: reserva.horario_fim.slice(0, 5),
    destino: reserva.destino,
    finalidade: reserva.finalidade,
    quantidade_passageiros: Number(reserva.quantidade_passageiros),
  };
}

function GerenciarRecorrenciaVeiculoModal({
  aberto,
  recorrenciaId,
  aoFechar,
  aoSalvar,
  aoCancelarRecorrencia,
}) {
  const controleModal = useRef(null);
  const [recorrencia, setRecorrencia] = useState(null);
  const [alteraveis, setAlteraveis] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [veiculoId, setVeiculoId] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  const [destino, setDestino] = useState('');
  const [finalidade, setFinalidade] = useState('');
  const [ocupantes, setOcupantes] = useState(1);
  const [observacoes, setObservacoes] = useState('');
  const [conflitos, setConflitos] = useState([]);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const consultaVeiculo = useListaPaginada('/api/veiculos/', { id: veiculoId }, aberto && Boolean(veiculoId));
  const veiculo = consultaVeiculo.itens[0];

  useEffect(() => {
    if (!aberto || !recorrenciaId) return;

    let descartada = false;

    buscarRecorrenciaVeiculo(recorrenciaId)
      .then((dados) => {
        if (descartada) return;

        const lista = dados.reservas.filter((reserva) => dados.alteraveis.includes(reserva.id));
        const referencia = lista[0];

        setRecorrencia(dados.recorrencia);
        setAlteraveis(lista);

        if (!referencia) return;

        setTitulo(referencia.nome);
        setVeiculoId(String(referencia.veiculo));
        setHorarioInicio(referencia.horario_inicio.slice(0, 5));
        setHorarioFim(referencia.horario_fim.slice(0, 5));
        setDestino(referencia.destino);
        setFinalidade(referencia.finalidade);
        setOcupantes(referencia.quantidade_passageiros);
        setObservacoes(referencia.descricao || '');
      })
      .catch((falha) => {
        if (!descartada) setErro(mensagemDeErro(falha, 'Não foi possível carregar a recorrência.'));
      })
      .finally(() => {
        if (!descartada) setCarregando(false);
      });

    return () => {
      descartada = true;
    };
  }, [aberto, recorrenciaId]);

  const referencia = alteraveis[0];
  const retornoNoMesmoDia = referencia?.data === referencia?.data_devolucao_prevista;

  const dadosRecorrencia = {
    nome: titulo.trim(),
    descricao: observacoes.trim(),
    veiculo: Number(veiculoId),
    horario_inicio: horarioInicio,
    horario_fim: horarioFim,
    destino: destino.trim(),
    finalidade: finalidade.trim(),
    quantidade_passageiros: Number(ocupantes),
  };

  async function salvar(evento) {
    evento.preventDefault();
    setErro('');
    setConflitos([]);

    if (!veiculoId || !veiculo) {
      setErro('Selecione um veículo.');
      return;
    }

    if (retornoNoMesmoDia && horarioFim <= horarioInicio) {
      setErro('O horário de retorno deve ser posterior ao de retirada.');
      return;
    }

    if (ocupantes < 1 || ocupantes > veiculo.capacidade) {
      setErro(`Informe de 1 a ${veiculo.capacidade} ocupantes, incluindo o motorista.`);
      return;
    }

    const alterados = camposAlterados(camposEditaveis(referencia), dadosRecorrencia);

    if (Object.keys(alterados).length === 0) {
      setErro('Nenhuma alteração para salvar.');
      return;
    }

    try {
      setEnviando(true);
      aoSalvar(await atualizarRecorrenciaVeiculo(recorrenciaId, alterados));
    } catch (erroRequisicao) {
      const conflitosEdicao = conflitosRecorrencia(erroRequisicao);

      if (conflitosEdicao.length) {
        setConflitos(conflitosEdicao);
      } else {
        setErro(mensagemDeErro(erroRequisicao, 'Não foi possível alterar a recorrência.'));
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
      aoCancelarRecorrencia(await cancelarRecorrenciaVeiculo(recorrenciaId));
    } catch (erroRequisicao) {
      setErro(mensagemDeErro(erroRequisicao, 'Não foi possível cancelar as reservas da recorrência.'));
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
      ref={controleModal}
      confirmarDescarte
      aberto={aberto}
      titulo="Gerenciar recorrência"
      aoFechar={aoFechar}
      processando={enviando}
    >
      {carregando ? (
        <p className="text-muted mb-0" role="status">Carregando recorrência...</p>
      ) : !recorrencia ? (
        <AlertBanner tipo="erro" mensagem={erro || 'Não foi possível carregar a recorrência.'} />
      ) : !referencia ? (
        <Alert variant="warning" className="py-2 mb-0">
          Não há reservas futuras que ainda possam ser alteradas nesta recorrência.
        </Alert>
      ) : (
        <form className={styles.formulario} onSubmit={salvar}>
          <Alert variant="success" className="d-flex align-items-start gap-2 py-2 mb-0">
            <Repeat size={16} className="flex-shrink-0 mt-1" />
            <div>
              <span className="fw-medium">
                {TIPO_RECORRENCIA_LABEL[recorrencia.tipo] || recorrencia.tipo} · de{' '}
                {formatarDataCurta(recorrencia.data_inicio)} a {formatarDataCurta(recorrencia.data_fim)}
              </span>
              <p className="small mb-0">
                As alterações serão aplicadas às {alteraveis.length} reserva(s) futuras.
                Reservas confirmadas voltarão para aprovação.
              </p>
            </div>
          </Alert>

          <label>
            Título
            <input required minLength={5} maxLength={50} value={titulo}
              onChange={(evento) => setTitulo(evento.target.value)} />
          </label>

          <label>
            Veículo
            <SelectRemoto url="/api/veiculos/" ativo={aberto}
              filtros={{ status: 'ATIVO', page_size: 100 }} mostrarBusca={false}
              required ariaLabel="Veículo" valor={veiculoId} aoAlterar={setVeiculoId} />
          </label>

          <div className={styles.horarios}>
            <label>
              Horário de retirada
              <select required value={horarioInicio} onChange={(evento) => setHorarioInicio(evento.target.value)}>
                {HORARIOS.map((horario) => <option key={horario}>{horario}</option>)}
              </select>
            </label>
            <label>
              Horário de retorno
              <select required value={horarioFim} onChange={(evento) => setHorarioFim(evento.target.value)}>
                {HORARIOS.map((horario) => <option key={horario}>{horario}</option>)}
              </select>
            </label>
          </div>
          {!retornoNoMesmoDia && (
            <small>As datas de retirada e retorno de cada reserva são mantidas.</small>
          )}

          <label>
            Destino
            <input required maxLength={50} value={destino}
              onChange={(evento) => setDestino(evento.target.value)} />
          </label>
          <label>
            Finalidade
            <input required maxLength={255} value={finalidade}
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
            <textarea rows={3} maxLength={255} value={observacoes}
              placeholder="Informações adicionais..."
              onChange={(evento) => setObservacoes(evento.target.value)} />
          </label>

          {conflitos.length > 0 && (
            <AlertBanner
              tipo="erro"
              mensagem={(
                <>
                  <p className="fw-medium mb-1">Não foi possível alterar a recorrência:</p>
                  <ul className="mb-0 ps-3">
                    {conflitos.map((conflito) => (
                      <li key={conflito}>{conflito}</li>
                    ))}
                  </ul>
                </>
              )}
            />
          )}

          <AlertBanner tipo="erro" mensagem={erro} />

          <div className={styles.acoes}>
            <Botao
              titulo="Cancelar"
              estilo="secundario"
              aoClicar={() => controleModal.current?.fechar()}
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

export default GerenciarRecorrenciaVeiculoModal;
