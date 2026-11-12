import SkeletonBase from './SkeletonBase';
import { Bloco, Linha } from './Bloco';
import styles from './Skeleton.module.css';

function ColunaDetalhe() {
  return (
    <div className="col-md-6">
      <Linha altura={19} className="mb-2">
        <Bloco largura={110} altura={14} />
      </Linha>
      <Linha altura={21}><Bloco largura="90%" altura={10} /></Linha>
      <Linha altura={21}><Bloco largura="75%" altura={10} /></Linha>
      <Linha altura={21} className="mb-3"><Bloco largura="50%" altura={10} /></Linha>
      <Linha altura={37} className="border-top pt-3">
        <Bloco largura="60%" altura={10} />
      </Linha>
    </div>
  );
}


// Skeleton das páginas de detalhe (área e veículo)
function SkeletonDetalhe({ rotulo }) {
  return (
    <SkeletonBase rotulo={rotulo} className="p-3 p-md-4">
      <Linha altura={24} className="mb-3">
        <Bloco largura={150} altura={12} />
      </Linha>

      <div className="bg-white rounded-4 border overflow-hidden">
        <div className={`px-4 py-5 ${styles.cabecalhoDetalhe}`}>
          <div className="d-flex align-items-start gap-3">
            <Bloco largura={56} altura={56} raio={8} />
            <div className="flex-grow-1">
              <Linha altura={24} className="mb-1">
                <Bloco largura={90} altura={18} raio={999} />
              </Linha>
              <Linha altura={38} className="mb-2">
                <Bloco largura="45%" altura={24} />
              </Linha>
              <Linha altura={21}>
                <Bloco largura={120} altura={10} />
              </Linha>
            </div>
          </div>
        </div>

        <div className="row g-4 p-4">
          <ColunaDetalhe />
          <ColunaDetalhe />
        </div>
      </div>
    </SkeletonBase>
  );
}

export default SkeletonDetalhe;
