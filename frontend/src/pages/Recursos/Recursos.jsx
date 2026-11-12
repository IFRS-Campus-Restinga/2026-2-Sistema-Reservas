import useListaPaginada from '../../hooks/useListaPaginada';
import Paginacao from '../../components/Administracao/Paginacao/Paginacao';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import CampoBusca from '../../components/Administracao/CampoBusca/CampoBusca';
import BarraFiltros from '../../components/BarraFiltros/BarraFiltros';
import CardRecurso from '../../components/CardRecurso/CardRecurso';
import ReservaRecursoGeralModal from '../../components/ReservaRecursoGeral/ReservaRecursoGeralModal';
import SelectRemoto from '../../components/SelectRemoto/SelectRemoto';
import AlertBanner from '../../components/AlertBanner/AlertBanner';
import styles from './Recursos.module.css';
import SkeletonCardLista from '../../components/Skeleton/SkeletonCardLista';

function Recursos() {
  const navigate = useNavigate();

  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('todos');
  const [reserva, setReserva] = useState(null);

  const { itens: tiposExibidos, total, carregando, erro, paginacao } = useListaPaginada('/api/tipos-recurso/', { catalogo: true, busca, categoria });
  function abrirReserva(tipo) { setReserva({ tipo }); }

  return (
    <div className={styles.pagina}>
      <BarraFiltros>
        <CampoBusca
          valor={busca}
          aoAlterar={setBusca}
          placeholder="Buscar tipo de recurso"
        />
      
        <SelectRemoto
          url="/api/categorias-recurso/"
          filtros={{ page_size: 100 }}
          mostrarBusca={false}
          valor={categoria}
          aoAlterar={setCategoria}
          valorTodos="todos"
          rotuloTodos="Todas as categorias"
          ariaLabel="Filtrar por categoria"
        />
      </BarraFiltros>

      <AlertBanner tipo="erro" mensagem={erro} />
      <section
        className={styles.resultados}
        aria-label="Tipos de recursos disponíveis"
      >
        <div className={styles.cabecalhoResultados}>
          <h2>Tipos de recurso</h2>
          <span>{total} tipo(s) encontrado(s)</span>
        </div>

        {carregando ? (
          <SkeletonCardLista rotulo="Carregando recursos..." quantidade={6} classeGrade={styles.grade} />
        ) : tiposExibidos.length === 0 ? (
          <div className={styles.vazio}>
            <PackageSearch size={30} aria-hidden="true" />
            <p>Nenhum recurso encontrado.</p>
          </div>
        ) : (
          <div className={styles.grade}>
            {tiposExibidos.map((tipo) => (
              <div
                key={tipo.id}
                className={styles.cartao}
                role="button"
                tabIndex={0}
                aria-label={`Reservar recurso do tipo ${tipo.descricao}`}
                onKeyDown={(evento) => {
                  if (evento.key === 'Enter' || evento.key === ' ') {
                    evento.preventDefault();
                    abrirReserva(tipo);
                  }
                }}
              >
                <CardRecurso
                  categoria={tipo.categoria_icone}
                  nomeCategoria={tipo.categoria_nome}
                  titulo={tipo.descricao}
                  resumo={tipo}
                  aoClicar={() => abrirReserva(tipo)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <Paginacao {...paginacao} />
      <ReservaRecursoGeralModal
        aberto={Boolean(reserva)}
        tipo={reserva?.tipo}
        recursoInicial={reserva?.recurso}
        aoFechar={() => setReserva(null)}
        aoReservar={() =>
          navigate('/minhas-reservas', {
            state: { criada: true },
          })
        }
      />
    </div>
  );
}

export default Recursos;
