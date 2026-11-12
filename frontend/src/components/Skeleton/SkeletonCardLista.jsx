import { Card, Col, Row } from 'react-bootstrap';
import SkeletonBase from './SkeletonBase';
import { Bloco, Linha } from './Bloco';
import styles from './Skeleton.module.css';

const LARGURAS_TITULO = ['70%', '55%', '80%', '60%'];

// Mesma estrutura de CardArea, CardVeiculo e CardRecurso.
function CardSkeleton({ indice }) {
  return (
    <Card className={`rounded-3 h-100 ${styles.card}`}>
      <Card.Body className="p-3">
        <div className="d-flex align-items-start justify-content-between mb-3">
          <Bloco largura={40} altura={40} raio={8} />
          <Bloco largura={56} altura={24} raio={999} />
        </div>

        <Linha altura={19} className="mb-2">
          <Bloco largura={LARGURAS_TITULO[indice % LARGURAS_TITULO.length]} altura={14} />
        </Linha>
        <Linha className="mt-1">
          <Bloco largura="85%" altura={10} />
        </Linha>

        <Linha className="mt-3 pt-3 border-top border-light" altura={35}>
          <Bloco largura={48} altura={10} />
        </Linha>
      </Card.Body>
    </Card>
  );
}

/**
 * Skeleton das listas em cards (Áreas, Veículos, Recursos).
 *
 * Props:
 * - rotulo: texto para leitor de tela.
 * - quantidade: número de cards.
 * - classeGrade (opcional): classe da grade da própria tela. Sem ela, usa o
 *   mesmo Row responsivo de Áreas e Veículos.
 */
function SkeletonCardLista({ rotulo, quantidade = 8, classeGrade }) {
  const indices = Array.from({ length: quantidade }, (_, indice) => indice);

  if (classeGrade) {
    return (
      <SkeletonBase rotulo={rotulo} classeVisual={classeGrade}>
        {indices.map((indice) => <CardSkeleton key={indice} indice={indice} />)}
      </SkeletonBase>
    );
  }

  return (
    <SkeletonBase rotulo={rotulo}>
      <Row xs={1} sm={2} md={3} lg={4} className="g-3">
        {indices.map((indice) => (
          <Col key={indice}>
            <CardSkeleton indice={indice} />
          </Col>
        ))}
      </Row>
    </SkeletonBase>
  );
}

export default SkeletonCardLista;
