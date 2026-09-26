import styles from "./Botao.module.css";

/**
 * Exemplo de uso:
 * <Botao
 *   titulo="Adicionar"
 *   icone={Plus}
 *   estilo="primario"
 *   tamanhoFonte="14px"
 *   aoClicar={() => abrirCadastro()}
 * />
 *
 * Props:
 * - titulo: texto do botão
 * - icone (opcional): componente de ícone (ex.: de lucide-react), renderizado no mesmo
 *   tamanho da fonte do botão
 * - estilo (opcional, default "primario"): "primario" | "secundario" | "perigo"
 * - tamanhoFonte (opcional, default "14px"): tamanho da fonte com unidade (ex.: "14px").
 * - aoClicar: função chamada ao clicar no botão
 * - desabilitado (opcional, default false): desabilita o botão
 * - tipo (opcional, default "button"): "button" | "submit"
 */

function Botao({
  titulo,
  icone: Icone,
  estilo = "primario",
  tamanhoFonte = "14px",
  aoClicar,
  desabilitado = false,
  tipo = "button",
}) {
  return (
    <button
      type={tipo}
      onClick={aoClicar}
      disabled={desabilitado}
      data-estilo={estilo}
      style={{ fontSize: tamanhoFonte }}
      className={`d-inline-flex align-items-center justify-content-center rounded-3 lh-1 ${
        desabilitado ? "opacity-50" : ""
      } ${styles.botao}`}
    >
      {Icone && <Icone size={tamanhoFonte} />}
      {titulo}
    </button>
  );
}

export default Botao;
