import { Form } from "react-bootstrap";
import styles from "./Select.module.css";

/**
 * Exemplo de uso:
 * <Select
 *   valor={filtroBloco}
 *   aoAlterar={setFiltroBloco}
 *   opcoes={blocos.map((b) => ({ valor: b.id, rotulo: b.nome }))}
 *   valorTodos="todos"
 *   rotuloTodos="Todos os blocos"
 * />
 *
 * Ou agrupado (ex.: áreas por bloco, sem opção "todos"):
 * <Select
 *   valor={areaId}
 *   aoAlterar={setAreaId}
 *   grupos={blocos.map((b) => ({
 *     rotulo: b.nome,
 *     opcoes: areasDoBloco(b).map((a) => ({ valor: a.id, rotulo: a.nome, desabilitado: a.status !== 'ATIVO' })),
 *   }))}
 *   required
 * />
 *
 * Props:
 * - opcoes: array de { valor, rotulo } com as opções do select
 * - grupos: array de { rotulo, opcoes: [{ valor, rotulo, desabilitado }] } — quando necessário,
 *   renderiza <optgroup> por grupo em vez da lista plana de "opcoes"
 * - valorTodos (opcional): valor da opção que representa "sem filtro" (ex.: "todos", 0)
 * - rotuloTodos (opcional): rótulo exibido para a opção "sem filtro" — só é renderizada
 *   quando valorTodos e rotuloTodos são passados juntos
 * - valor: valor atual selecionado  
 * - aoAlterar: função chamada ao alterar a seleção
 * - ariaLabel (opcional): rótulo acessível do select
 * - required (opcional, default false): torna o select obrigatório
 */

function Select({
  opcoes = [],
  grupos,
  valorTodos,
  rotuloTodos,
  valor,
  aoAlterar,
  ariaLabel,
  required = false,
}) {
  return (
    <Form.Select
      className={`rounded-3 ${styles.select}`}
      value={valor}
      onChange={(evento) => aoAlterar(evento.target.value)}
      aria-label={ariaLabel}
      required={required}
    >
      {valorTodos !== undefined && rotuloTodos && (
        <option value={valorTodos}>{rotuloTodos}</option>
      )}

      {grupos
        ? grupos.map((grupo) => (
            <optgroup key={grupo.rotulo} label={grupo.rotulo}>
              {grupo.opcoes.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor} disabled={opcao.desabilitado}>
                  {opcao.rotulo}
                </option>
              ))}
            </optgroup>
          ))
        : opcoes.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
    </Form.Select>
  );
}

export default Select;
