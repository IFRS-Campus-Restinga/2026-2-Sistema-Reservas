import useListaPaginada from '../../hooks/useListaPaginada';
import Paginacao from '../../components/Administracao/Paginacao/Paginacao';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import CampoBusca from '../../components/Administracao/CampoBusca/CampoBusca';
import CardRecurso from '../../components/CardRecurso/CardRecurso';
import ReservaRecursoGeralModal from '../../components/ReservaRecursoGeral/ReservaRecursoGeralModal';
import Select from '../../components/Select/Select';
import { CATEGORIA_RECURSO_LABEL } from '../../utils/categoriaRecurso';
import styles from './Recursos.module.css';

function Recursos() {
  const navigate = useNavigate();

  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('todos');
  const [reserva, setReserva] = useState(null);

  const { itens: tiposExibidos, total, carregando, erro, paginacao } = useListaPaginada('/api/tipos-recurso/', { catalogo: true, busca, categoria });
  const opcoesCategoria = Object.entries(CATEGORIA_RECURSO_LABEL).map(([valor, rotulo]) => ({ valor, rotulo }));
  function abrirReserva(tipo) { setReserva({ tipo }); }

  return (
    <div className={styles.pagina}>
      <div className="d-flex flex-wrap align-items-center justify-content-center gap-2">
        <CampoBusca
          valor={busca}
          aoAlterar={setBusca}
          placeholder="Buscar tipo de recurso"
        />
      
        <Select
          valor={categoria}
          aoAlterar={setCategoria}
          opcoes={opcoesCategoria}
          valorTodos="todos"
          rotuloTodos="Todas as categorias"
          ariaLabel="Filtrar por categoria"
        />
      </div>

      {erro && <p role="alert">{erro}</p>}
      <section
        className={styles.resultados}
        aria-label="Tipos de recursos disponíveis"
      >
        <div className={styles.cabecalhoResultados}>
          <h2>Tipos de recurso</h2>
          <span>{total} tipo(s) encontrado(s)</span>
        </div>

        {carregando ? <p role="status">Carregando recursos...</p> : tiposExibidos.length === 0 ? (
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
                  categoria={tipo.categoria}
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
