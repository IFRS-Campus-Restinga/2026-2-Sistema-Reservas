
import { useEffect, useState } from 'react';
import { PackageSearch } from 'lucide-react';

import CardRecurso from '../../components/CardRecurso/CardRecurso';
import { listarRecursosGerais, listarTiposRecurso } from '../../services';
import { CATEGORIA_RECURSO_LABEL } from '../../utils/categoriaRecurso';
import { TIPO_PRAZO_LABEL } from '../../utils/tipoPrazo';
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

function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

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

function quantidadeDisponivel(recurso) {
  return Math.max(
    0,
    Number(recurso.quantidade_total) - Number(recurso.quantidade_reservada)
  );
}

function Recursos() {
  const [recursos, setRecursos] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [categoria, setCategoria] = useState('');
  const [tipoAberto, setTipoAberto] = useState('');

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

  const grupos = tipos.map((tipo) => ({
    ...tipo,
    categoriaReserva: categoriaDoTipo(tipo),
    recursos: recursos.filter(
      (recurso) => String(recurso.tipo_recurso) === String(tipo.id)
    ),
  })).filter((tipo) => tipo.recursos.some(
    (recurso) =>
      recurso.status === 'ATIVO' &&
      quantidadeDisponivel(recurso) > 0
  ));

  const categoriasDisponiveis = new Set(
    grupos.map((tipo) => tipo.categoriaReserva)
  );

  const tiposExibidos = grupos
    .filter((tipo) => !categoria || tipo.categoriaReserva === categoria)
    .sort((a, b) => a.descricao.localeCompare(b.descricao, 'pt-BR'));

  const selecionado = tiposExibidos.find(
    (tipo) => String(tipo.id) === tipoAberto
  );

  function filtrarCategoria(novaCategoria) {
    setCategoria(novaCategoria);
    setTipoAberto('');
  }

  function selecionarTipo(id) {
    setTipoAberto(tipoAberto === id ? '' : id);
  }

  return (
    <div className={styles.pagina}>

      <section className={styles.filtros} aria-label="Filtros de recursos">
        <div className={styles.cabecalhoFiltros}>
          <h2>Categorias</h2>
          <span>Selecione uma para filtrar os tipos</span>
        </div>

        <div className={styles.categorias}>
          <button
            type="button"
            className={`${styles.filtroCategoria} ${!categoria ? styles.ativo : ''}`}
            onClick={() => filtrarCategoria('')}
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
                onClick={() => filtrarCategoria(codigo)}
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
                role="button"
                tabIndex={0}
                aria-label={`Ver recursos do tipo ${tipo.descricao}`}
                aria-pressed={String(tipo.id) === tipoAberto}
                className={`${styles.cartao} ${
                  String(tipo.id) === tipoAberto ? styles.selecionado : ''
                }`}
                onKeyDown={(evento) => {
                  if (evento.key === 'Enter' || evento.key === ' ') {
                    evento.preventDefault();
                    selecionarTipo(String(tipo.id));
                  }
                }}
              >
                <CardRecurso
                  categoria={tipo.categoriaReserva}
                  titulo={tipo.descricao}
                  recursos={tipo.recursos}
                  aoClicar={() => selecionarTipo(String(tipo.id))}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {selecionado && (
        <section
          className={styles.detalhes}
          aria-label={`Recursos do tipo ${selecionado.descricao}`}
        >
          <div className={styles.cabecalhoResultados}>
            <div>
              <h2>{selecionado.descricao}</h2>
              <p>
                {CATEGORIA_RECURSO_LABEL[selecionado.categoriaReserva]}
              </p>
            </div>

            <button
              type="button"
              className={styles.fechar}
              onClick={() => setTipoAberto('')}
            >
              Fechar
            </button>
          </div>

          <div className={styles.listaItens}>
            {selecionado.recursos
              .filter(
                (recurso) =>
                  recurso.status === 'ATIVO' &&
                  quantidadeDisponivel(recurso) > 0
              )
              .map((recurso) => (
                <div className={styles.item} key={recurso.id}>
                  <div>
                    <h3>{recurso.nome}</h3>
                    <p>
                      {TIPO_PRAZO_LABEL[recurso.tipo_prazo] || recurso.tipo_prazo}
                      {recurso.codigo && ` · Código: ${recurso.codigo}`}
                      {recurso.tem_termo_de_responsabilidade && ' · Exige termo'}
                    </p>
                  </div>

                  <strong>
                    {quantidadeDisponivel(recurso)} disponível(is)
                  </strong>
                </div>
              ))}
          </div>

          <p className={styles.observacao}>
            A disponibilidade para a data escolhida será confirmada
            na etapa de reserva.
          </p>
        </section>
      )}
    </div>
  );
}

export default Recursos;
