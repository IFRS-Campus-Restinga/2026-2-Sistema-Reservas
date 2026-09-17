import styles from './TabelaAdmin.module.css';

function TabelaAdmin({ colunas, dados,mensagemVazia = "Nenhum item encontrado.",}) 
{
  return (
    <div className={styles.container}>
      <table className={styles.tabela}>
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
          {dados.map((item) => (
            <tr key={item.id}>
              {colunas.map((coluna) => (
                <td key={coluna.chave}>
                  {coluna.renderizar ? coluna.renderizar(item): item[coluna.campo]}
                </td>
              ))}
            </tr>
          ))}

          {dados.length === 0 && (
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
