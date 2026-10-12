import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageSearch } from 'lucide-react';
import CampoBusca from '../../components/Administracao/CampoBusca/CampoBusca';
import CardRecurso from '../../components/CardRecurso/CardRecurso';
import ReservaRecursoGeralModal from '../../components/ReservaRecursoGeral/ReservaRecursoGeralModal';
import Select from '../../components/Select/Select';
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
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('todos');
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

  const opcoesCategoria = Object.entries(CATEGORIA_RECURSO_LABEL)
      .filter(([codigo]) => categoriasDisponiveis.has(codigo))
      .map(([codigo, nome]) => ({ valor: codigo, rotulo: nome }));
  
  const termo = normalizar(busca.trim());
  const tiposExibidos = grupos
    .filter((tipo) => {
      const combinaBusca = normalizar(tipo.descricao).includes(termo);
      const combinaCategoria =
        categoria === 'todos' || tipo.categoriaReserva === categoria;
    
      return combinaBusca && combinaCategoria;
    })
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
