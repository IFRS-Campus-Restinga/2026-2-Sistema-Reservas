import { Bloco, Linha } from './Bloco';
import styles from './Skeleton.module.css';

const LARGURAS = ['75%', '50%', '90%', '60%', '40%'];

// Linhas de skeleton para o <tbody> de TabelaAdmin: uma barra por coluna.
 
function SkeletonTabela({ colunas, linhas = 8 }) {
  return Array.from({ length: linhas }, (_, linha) => (
    <tr key={linha} aria-hidden="true" className="pe-none">
      {colunas.map((coluna, indice) => (
        <td key={coluna.chave}>
          <div className={`placeholder-glow ${styles.visual}`}>
            <Linha altura={20}>
              <Bloco largura={LARGURAS[(linha + indice) % LARGURAS.length]} altura={10} />
            </Linha>
          </div>
        </td>
      ))}
    </tr>
  ));
}

export default SkeletonTabela;
