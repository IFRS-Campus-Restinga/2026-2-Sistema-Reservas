import { useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';
import { Repeat, Trash2 } from 'lucide-react';
import Modal from '../Administracao/Modal/Modal';
import ModalConfirmacao from '../Administracao/ModalConfirmacao/ModalConfirmacao';
import Botao from '../Botao/Botao';
import SelectRemoto from '../SelectRemoto/SelectRemoto';
import useListaPaginada from '../../hooks/useListaPaginada';
import {
  atualizarRecorrenciaRecursoGeral,
  buscarRecorrenciaRecursoGeral,
  cancelarRecorrenciaRecursoGeral,
} from '../../services/reservasRecursosGerais';
import { formatarDataCurta } from '../../utils/data';
import {
  TIPO_RECORRENCIA_LABEL,
  camposAlterados,
  conflitosRecorrencia,
} from '../../utils/recorrencia';
import styles from './GerenciarRecorrenciaRecursoGeralModal.module.css';

/**
 * Exemplo de uso:
 * <GerenciarRecorrenciaRecursoGeralModal
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

const HORARIOS = Array.from({ length: 29 }, (_, indice) => {
  const total = 7 * 60 + indice * 30;
  const horas = String(Math.floor(total / 60)).padStart(2, '0');
  const minutos = String(total % 60).padStart(2, '0');

  return `${horas}:${minutos}`;
});

function camposEditaveis(reserva) {
  return {
    nome: reserva.nome,
    descricao: reserva.descricao || '',
    recurso_geral: Number(reserva.recurso_geral),
    horario_inicio: reserva.horario_inicio.slice(0, 5),
    horario_fim: reserva.horario_fim.slice(0, 5),
    quantidades: Number(reserva.quantidades),
  };
}

function GerenciarRecorrenciaRecursoGeralModal({
  aberto,
  recorrenciaId,
  aoFechar,
  aoSalvar,
  aoCancelarRecorrencia,
}) {
  const [recorrencia, setRecorrencia] = useState(null);
  const [alteraveis, setAlteraveis] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [titulo, setTitulo] = useState('');
  const [recursoId, setRecursoId] = useState('');
  const [horarioInicio, setHorarioInicio] = useState('');
  const [horarioFim, setHorarioFim] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [observacoes, setObservacoes] = useState('');
  const [conflitos, setConflitos] = useState([]);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const referencia = alteraveis[0];

  const consultaOriginal = useListaPaginada(
    '/api/recursos-gerais/',
    { id: referencia?.recurso_geral },
    aberto && Boolean(referencia)
  );
  const tipoRecursoId = consultaOriginal.itens[0]?.tipo_recurso;
  const consultaRecurso = useListaPaginada('/api/recursos-gerais/', { id: recursoId }, aberto && Boolean(recursoId));
  const recurso = consultaRecurso.itens[0];

  useEffect(() => {
    if (!aberto || !recorrenciaId) return;

    let descartada = false;

    buscarRecorrenciaRecursoGeral(recorrenciaId)
      .then((dados) => {
        if (descartada) return;


        const lista = dados.reservas.filter((reserva) => dados.alteraveis.includes(reserva.id));
        const primeira = lista[0];

        setRecorrencia(dados.recorrencia);
        setAlteraveis(lista);

        if (!primeira) return;

        setTitulo(primeira.nome);
        setRecursoId(String(primeira.recurso_geral));
        setHorarioInicio(primeira.horario_inicio.slice(0, 5));
        setHorarioFim(primeira.horario_fim.slice(0, 5));
        setQuantidade(primeira.quantidades);
        setObservacoes(primeira.descricao || '');
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

  const dadosRecorrencia = {
    nome: titulo.trim(),
    descricao: observacoes.trim(),
    recurso_geral: Number(recursoId),
    horario_inicio: horarioInicio,
    horario_fim: horarioFim,
    quantidades: Number(quantidade),
  };

  async function salvar(evento) {
    evento.preventDefault();
    setErro('');
    setConflitos([]);

    if (!recursoId || !recurso) {
      setErro('Selecione um recurso.');
      return;
    }

    if (horarioFim <= horarioInicio) {
      setErro('O horário de devolução deve ser posterior ao de retirada.');
      return;
    }

    if (quantidade < 1 || quantidade > recurso.quantidade_total) {
      setErro(`Informe de 1 a ${recurso.quantidade_total} unidade(s).`);
      return;
    }

    const alterados = camposAlterados(camposEditaveis(referencia), dadosRecorrencia);

    if (Object.keys(alterados).length === 0) {
      setErro('Nenhuma alteração para salvar.');
      return;
    }

    try {
      setEnviando(true);
      aoSalvar(await atualizarRecorrenciaRecursoGeral(recorrenciaId, alterados));
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
      aoCancelarRecorrencia(await cancelarRecorrenciaRecursoGeral(recorrenciaId));
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
                {recurso?.tem_termo_de_responsabilidade &&
                  ' Alterar recurso, horário ou quantidade exige um novo termo em cada reserva.'}
              </p>
            </div>
          </Alert>

          <label>
            Título
            <input required minLength={5} maxLength={50} value={titulo}
              onChange={(evento) => setTitulo(evento.target.value)} />
          </label>

          <label>
            Recurso
            <SelectRemoto url="/api/recursos-gerais/" ativo={aberto && Boolean(tipoRecursoId)}
              filtros={{ tipo_recurso: tipoRecursoId, tipo_prazo: 'CURTO_PRAZO', disponiveis: true, page_size: 100 }}
              mostrarBusca={false} required ariaLabel="Recurso" valor={recursoId} aoAlterar={setRecursoId} />
            <small>Apenas recursos de curto prazo do mesmo tipo.</small>
          </label>

          <div className={styles.horarios}>
            <label>
              Horário de retirada
              <select required value={horarioInicio} onChange={(evento) => setHorarioInicio(evento.target.value)}>
                {HORARIOS.map((horario) => <option key={horario}>{horario}</option>)}
              </select>
            </label>
            <label>
              Horário de devolução
              <select required value={horarioFim} onChange={(evento) => setHorarioFim(evento.target.value)}>
                {HORARIOS.map((horario) => <option key={horario}>{horario}</option>)}
              </select>
            </label>
          </div>

          <label>
            Quantidade
            <input required type="number" min={1} max={recurso?.quantidade_total || 1}
              value={quantidade} onChange={(evento) => setQuantidade(Number(evento.target.value))} />
            <small>
              Total do recurso: {recurso?.quantidade_total || 0} unidade(s). A disponibilidade
              de cada data é conferida ao salvar.
            </small>
          </label>

          <label>
            Observações
            <textarea rows={3} maxLength={255} value={observacoes}
              placeholder="Informações adicionais..."
              onChange={(evento) => setObservacoes(evento.target.value)} />
          </label>

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

export default GerenciarRecorrenciaRecursoGeralModal;
