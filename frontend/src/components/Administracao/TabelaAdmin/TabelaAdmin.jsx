import { Fragment } from 'react';
import SkeletonTabela from '../../Skeleton/SkeletonTabela';
import styles from './TabelaAdmin.module.css';

// renderizarExpansao (opcional): conteúdo exibido numa linha abaixo do item; retorne null para não exibir
// carregando (opcional): troca as linhas por um skeleton, mantendo o cabeçalho real
// rotuloCarregando (opcional): texto lido pelo leitor de tela durante o carregamento
function TabelaAdmin({
  colunas,
  dados,
  mensagemVazia = "Nenhum item encontrado.",
  renderizarExpansao,
  carregando = false,
  rotuloCarregando = "Carregando...",
})
{
  return (
    <div className={styles.container}>
      {carregando && <span role="status" className="visually-hidden">{rotuloCarregando}</span>}

      <table className={styles.tabela} aria-busy={carregando}>
        <thead>
          <tr>
            {colunas.map((coluna) => (
              <th key={coluna.chave} scope="col">
                {coluna.titulo}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {carregando && <SkeletonTabela colunas={colunas} />}

          {!carregando && dados.map((item) => {
            const expansao = renderizarExpansao?.(item);

            return (
              <Fragment key={item.id}>
                <tr>
                  {colunas.map((coluna) => (
                    <td key={coluna.chave}>
                      {coluna.renderizar ? coluna.renderizar(item): item[coluna.campo]}
                    </td>
                  ))}
                </tr>

                {expansao && (
                  <tr className={styles.linhaExpandida}>
                    <td colSpan={colunas.length}>{expansao}</td>
                  </tr>
                )}
              </Fragment>
            );
          })}

          {!carregando && dados.length === 0 && (
            <tr>
              <td colSpan={colunas.length} className={styles.vazio}>
                {mensagemVazia}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TabelaAdmin;
/* colSpan é um atributo HTML que permite que uma célula de tabela se estenda por várias colunas */
