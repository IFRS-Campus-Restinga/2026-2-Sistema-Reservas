
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import CardRecurso from '../../components/CardRecurso/CardRecurso';
import ReservaRecursoGeralModal from '../../components/ReservaRecursoGeral/ReservaRecursoGeralModal';
import { listarRecursosGerais, listarTiposRecurso } from '../../services';
import { CATEGORIA_RECURSO_LABEL } from '../../utils/categoriaRecurso';
import { normalizar } from '../../utils/texto';
import styles from './Recursos.module.css';

const CATEGORIAS_ANTIGAS = {
  ESPORTES: 'MATERIAL_ESPORTIVO',
  MANUTENCAO: 'FERRAMENTAS',
  APOIO: 'MATERIAL_APOIO',
};

const TIPOS_AUDIOVISUAL = [
  'Projetores',
  'Caixas de som',
  'Microfones',
  'Câmeras fotográficas',
  'Suportes para projetor',
];

function categoriaDoTipo(tipo) {
  if (CATEGORIA_RECURSO_LABEL[tipo.categoria]) {
    return tipo.categoria;
  }

  if (tipo.categoria === 'TECNOLOGIA') {
    const audiovisual = TIPOS_AUDIOVISUAL.some(
      (descricao) => normalizar(descricao) === normalizar(tipo.descricao)
    );

    return audiovisual ? 'AUDIOVISUAL' : 'INFORMATICA';
  }

  return CATEGORIAS_ANTIGAS[tipo.categoria] || 'OUTROS';
}

function Recursos() {
  const navigate = useNavigate();

  const [recursos, setRecursos] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [categoria, setCategoria] = useState('');
  const [reserva, setReserva] = useState(null);

  useEffect(() => {
    Promise.all([
      listarRecursosGerais(),
      listarTiposRecurso(),
    ])
      .then(([listaRecursos, listaTipos]) => {
        setRecursos(listaRecursos);
        setTipos(listaTipos);
      })
      .catch(console.error);
  }, []);

  const grupos = tipos
    .map((tipo) => ({
      ...tipo,
      categoriaReserva: categoriaDoTipo(tipo),
      recursos: recursos.filter(
        (recurso) => String(recurso.tipo_recurso) === String(tipo.id)
      ),
    }))
    .filter((tipo) =>
      tipo.recursos.some(
        (recurso) =>
          recurso.status === 'ATIVO' &&
          Number(recurso.quantidade_total) > 0
      )
    );

  const categoriasDisponiveis = new Set(
    grupos.map((tipo) => tipo.categoriaReserva)
  );

  const tiposExibidos = grupos
    .filter((tipo) => !categoria || tipo.categoriaReserva === categoria)
    .sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR'));

  function abrirReserva(tipo) {
    const recurso = tipo.recursos.find(
      (item) =>
        item.status === 'ATIVO' &&
        Number(item.quantidade_total) > 0
    );

    if (recurso) {
      setReserva({ tipo, recurso });
    }
  }

  return (
    <div className={styles.pagina}>
      <div className={styles.apresentacao}>
        <p>
          Escolha uma categoria para consultar os tipos de recurso disponíveis.
        </p>
      </div>

      <section
        className={styles.filtros}
        aria-label="Filtros de recursos"
      >
        <div className={styles.cabecalhoFiltros}>
          <h2>Categorias</h2>
          <span>Selecione uma para filtrar os tipos</span>
        </div>

        <div className={styles.categorias}>
          <button
            type="button"
            className={`${styles.filtroCategoria} ${!categoria ? styles.ativo : ''}`}
            onClick={() => setCategoria('')}
            aria-pressed={!categoria}
          >
            Todas
          </button>

          {Object.entries(CATEGORIA_RECURSO_LABEL)
            .filter(([codigo]) => categoriasDisponiveis.has(codigo))
            .map(([codigo, nome]) => (
              <button
                type="button"
                key={codigo}
                className={`${styles.filtroCategoria} ${categoria === codigo ? styles.ativo : ''}`}
                onClick={() => setCategoria(codigo)}
                aria-pressed={categoria === codigo}
              >
                {nome}
              </button>
            ))}
        </div>
      </section>

      <section
        className={styles.resultados}
        aria-label="Tipos de recursos disponíveis"
      >
        <div className={styles.cabecalhoResultados}>
          <h2>Tipos de recurso</h2>
          <span>{tiposExibidos.length} tipo(s) encontrado(s)</span>
        </div>

        {tiposExibidos.length === 0 ? (
          <div className={styles.vazio}>
            <PackageSearch size={30} aria-hidden="true" />
            <p>Nenhum recurso disponível.</p>
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
                  categoria={tipo.categoriaReserva}
                  titulo={tipo.descricao}
                  recursos={tipo.recursos}
                  aoClicar={() => abrirReserva(tipo)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

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
