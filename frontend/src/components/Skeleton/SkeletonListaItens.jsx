import SkeletonBase from './SkeletonBase';
import { Bloco, Linha } from './Bloco';
import styles from './Skeleton.module.css';

// Mesma estrutura de CartaoReserva.
function ItemReserva() {
  return (
    <>
      <Bloco largura={6} altura={48} raio={999} />
      <div className={styles.conteudoItem}>
        <Linha altura={21}>
          <Bloco largura={64} altura={16} />
          <Bloco largura="40%" altura={12} />
        </Linha>
        <Linha className="mt-1"><Bloco largura="55%" altura={10} /></Linha>
        <Linha className="mt-2"><Bloco largura="35%" altura={10} /></Linha>
      </div>
      <Bloco largura={84} altura={24} raio={999} />
    </>
  );
}

// Mesma estrutura do card da página de Notificações.
function ItemNotificacao() {
  return (
    <>
      <Bloco largura={36} altura={36} raio={10} />
      <div className={styles.conteudoItem}>
        <Linha><Bloco largura="45%" altura={12} /></Linha>
        <Linha><Bloco largura="80%" altura={10} /></Linha>
        <Linha altura={15} className="mt-1"><Bloco largura={60} altura={8} /></Linha>
      </div>
    </>
  );
}

// Mesma estrutura do cartão de SolicitacoesAdmin.
function ItemSolicitacao() {
  return (
    <>
      <div className={styles.conteudoItem}>
        <Linha altura={24} className="mb-1">
          <Bloco largura="35%" altura={14} />
          <Bloco largura={70} altura={18} raio={999} />
          <Bloco largura={90} altura={18} raio={999} />
        </Linha>
        <Linha altura={21}><Bloco largura="60%" altura={10} /></Linha>
        <Linha className="mt-1">
          <Bloco largura={80} altura={10} />
          <Bloco largura={70} altura={10} />
          <Bloco largura={110} altura={10} />
        </Linha>
      </div>
      <div className={styles.acoesItem}>
        <Bloco largura={96} altura={32} raio={8} />
        <Bloco largura={96} altura={32} raio={8} />
      </div>
    </>
  );
}

// Mesma estrutura de CardGrupo.
function ItemGrupo() {
  return (
    <>
      <div className="d-flex align-items-start justify-content-between gap-3">
        <Linha altura={27} className="flex-grow-1">
          <Bloco largura="40%" altura={16} />
        </Linha>
        <div className="d-flex gap-1">
          <Bloco largura={28} altura={28} raio={8} />
          <Bloco largura={28} altura={28} raio={8} />
        </div>
      </div>
      <Linha altura={22}>
        <Bloco largura={90} altura={22} raio={999} />
        <Bloco largura={70} altura={22} raio={999} />
        <Bloco largura={130} altura={10} />
      </Linha>
      <Linha altura={20}>
        <Bloco largura={90} altura={10} />
        <Bloco largura={120} altura={10} />
      </Linha>
    </>
  );
}

const ITENS = {
  reserva: ItemReserva,
  notificacao: ItemNotificacao,
  solicitacao: ItemSolicitacao,
  grupo: ItemGrupo,
};

/**
 * Skeleton das listas verticais de itens.
 *
 * Props:
 * - rotulo (opcional): texto para leitor de tela. Sem ele o skeleton é decorativo.
 * - variante: "reserva" (CartaoReserva), "notificacao", "solicitacao" ou "grupo" (CardGrupo).
 * - quantidade: número de itens.
 * - espaco: distância entre os itens em px; use o mesmo "gap" da lista real.
 */
function SkeletonListaItens({ rotulo, variante = 'reserva', quantidade = 5, espaco = 10 }) {
  const Item = ITENS[variante] ?? ItemReserva;

  return (
    <SkeletonBase rotulo={rotulo}>
      <div className={styles.lista} style={{ gap: espaco }}>
        {Array.from({ length: quantidade }, (_, indice) => (
          <div key={indice} className={styles.item} data-variante={variante}>
            <Item />
          </div>
        ))}
      </div>
    </SkeletonBase>
  );
}

export default SkeletonListaItens;
