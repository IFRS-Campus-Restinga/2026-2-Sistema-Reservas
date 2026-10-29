import { Alert, Form } from 'react-bootstrap';
import { Repeat } from 'lucide-react';
import Botao from '../Botao/Botao';
import Select from '../Select/Select';
import { formatarDataCurta, somarDias } from '../../utils/data';
import {
  OPCOES_RECORRENCIA,
  gerarDatasRecorrencia,
  validarRecorrencia,
} from '../../utils/recorrencia';
import styles from './CamposRecorrencia.module.css';

/**
 * Exemplo de uso:
 * <CamposRecorrencia
 *   ativa={recorrente}
 *   aoAlternar={setRecorrente}
 *   tipo={tipoRecorrencia}
 *   aoAlterarTipo={setTipoRecorrencia}
 *   dataFim={dataFimRecorrencia}
 *   aoAlterarDataFim={setDataFimRecorrencia}
 *   dataInicio={data}
 *   conflitos={conflitos}
 *   datasConflitantes={datasConflitantes}
 *   aoPularConflitos={() => salvar({ pularConflitos: true })}
 *   desabilitado={enviando}
 * />
 *
 * Props:
 * - ativa: indica se a reserva é recorrente
 * - aoAlternar: função chamada com o novo valor (true/false) ao ligar/desligar a recorrência
 * - tipo: tipo de recorrência selecionado (ver TIPO_RECORRENCIA em utils/recorrencia)
 * - aoAlterarTipo: função chamada ao alterar o tipo
 * - dataFim: data "AAAA-MM-DD" até quando a reserva se repete
 * - aoAlterarDataFim: função chamada ao alterar a data final
 * - dataInicio: data "AAAA-MM-DD" da primeira reserva
 * - conflitos (opcional): mensagens devolvidas pelo backend ao recusar a recorrência
 * - datasConflitantes (opcional): datas "AAAA-MM-DD" em conflito que podem ser puladas
 * - aoPularConflitos (opcional): função chamada para criar a recorrência sem as datas em
 *   conflito; quando não informada, o botão "Pular datas" não é exibido
 * - desabilitado (opcional, default false): desabilita o botão "Pular datas" (ex.: enquanto salva)
 */

function CamposRecorrencia({
  ativa,
  aoAlternar,
  tipo,
  aoAlterarTipo,
  dataFim,
  aoAlterarDataFim,
  dataInicio,
  conflitos = [],
  datasConflitantes = [],
  aoPularConflitos,
  desabilitado = false,
}) {
  const erro = dataFim ? validarRecorrencia(dataInicio, tipo, dataFim) : '';
  const datas = erro ? [] : gerarDatasRecorrencia(dataInicio, tipo, dataFim);
  const restantes = datas.filter((data) => !datasConflitantes.includes(data)).length;
  const podePular = Boolean(aoPularConflitos) && datasConflitantes.length > 0;

  return (
    <div className="border rounded-3 p-3 d-flex flex-column gap-3">
      <div className="d-flex align-items-center justify-content-between">
        <label
          htmlFor="reserva-recorrente"
          className="d-flex align-items-center gap-2 fw-medium mb-0"
        >
          <Repeat size={16} className="text-muted" />
          Reserva recorrente
        </label>

        <Form.Check
          type="switch"
          id="reserva-recorrente"
          className={styles.alternador}
          checked={ativa}
          onChange={(evento) => aoAlternar(evento.target.checked)}
        />
      </div>

      {ativa && (
        <>
          <div className="row g-3 border-top pt-3 mt-0">
            <Form.Group className="col-6">
              <Form.Label>Frequência</Form.Label>
              <Select
                valor={tipo}
                aoAlterar={aoAlterarTipo}
                opcoes={OPCOES_RECORRENCIA}
                ariaLabel="Frequência"
                larguraTotal
              />
            </Form.Group>

            <Form.Group className="col-6">
              <Form.Label>Repetir até</Form.Label>
              <Form.Control
                type="date"
                min={dataInicio ? somarDias(dataInicio, 1) : undefined}
                value={dataFim}
                onChange={(evento) => aoAlterarDataFim(evento.target.value)}
                required
              />
            </Form.Group>
          </div>

          {erro && <Form.Text className="text-danger mt-0">{erro}</Form.Text>}

          {datas.length > 0 && (
            <Form.Text className="text-muted mt-0">
              {datas.length} ocorrência(s) gerada(s) até {formatarDataCurta(datas.at(-1))}
            </Form.Text>
          )}

          {conflitos.length > 0 && (
            <Alert variant="danger" className="py-2 mb-0" role="alert">
              <p className="fw-medium mb-1">Não foi possível criar a recorrência:</p>
              <ul className="small mb-0 ps-3">
                {conflitos.map((conflito) => (
                  <li key={conflito}>{conflito}</li>
                ))}
              </ul>

              {podePular && restantes >= 2 && (
                <div className="mt-2">
                  <Botao
                    titulo={`Pular ${datasConflitantes.length} data(s) e criar ${restantes} reservas`}
                    estilo="secundario"
                    tamanhoFonte="13px"
                    aoClicar={aoPularConflitos}
                    desabilitado={desabilitado}
                  />
                </div>
              )}

              {podePular && restantes < 2 && (
                <p className="small mb-0 mt-2">
                  Não há reservas suficientes para criar a recorrência sem essas datas.
                </p>
              )}
            </Alert>
          )}
        </>
      )}
    </div>
  );
}

export default CamposRecorrencia;
