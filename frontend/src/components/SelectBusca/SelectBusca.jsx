import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { normalizar } from '../../utils/texto';
import styles from './SelectBusca.module.css';

function SelectBusca({
  opcoes = [],
  valorTodos,
  rotuloTodos,
  valor,
  aoAlterar,
  ariaLabel,
  placeholderBusca = 'Buscar...',
  mensagemVazia = 'Nenhuma opção encontrada.',
  id,
  disabled = false,
  multiplo = false,
  busca: buscaExterna,
  aoBuscar,
  carregando = false,
  rotuloSelecionado,
  rodape,
}) {
  const [aberto, setAberto] = useState(false);
  const [buscaInterna, setBuscaInterna] = useState('');
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const containerRef = useRef(null);
  const botaoRef = useRef(null);
  const listaRef = useRef(null);
  const idLista = useId();

  const buscaRemota = Boolean(aoBuscar);
  const busca = buscaRemota ? buscaExterna ?? '' : buscaInterna;
  const alterarTextoBusca = buscaRemota ? aoBuscar : setBuscaInterna;

  const opcaoTodos = valorTodos !== undefined && rotuloTodos ? { valor: valorTodos, rotulo: rotuloTodos } : null;
  const todasOpcoes = opcaoTodos ? [opcaoTodos, ...opcoes] : opcoes;
  const termo = normalizar(busca.trim());
  const opcoesEncontradas = buscaRemota
    ? opcoes
    : opcoes.filter((opcao) => normalizar(opcao.rotulo).includes(termo));
  const opcoesFiltradas = opcaoTodos ? [opcaoTodos, ...opcoesEncontradas] : opcoesEncontradas;

  const valoresSelecionados = multiplo ? (valor ?? []).map(String) : [];
  const selecionada = multiplo ? null : todasOpcoes.find((opcao) => String(opcao.valor) === String(valor));

  function estaSelecionada(opcao) {
    if (!multiplo) return opcao === selecionada;
    if (opcao === opcaoTodos) return valoresSelecionados.length === 0;
    return valoresSelecionados.includes(String(opcao.valor));
  }

  function rotuloMultiplo() {
    if (valoresSelecionados.length === 0) return rotuloTodos ?? '';
    if (rotuloSelecionado) return rotuloSelecionado;
    if (valoresSelecionados.length === 1) {
      const unica = opcoes.find((opcao) => String(opcao.valor) === valoresSelecionados[0]);
      if (unica) return unica.rotulo;
    }
    const quantidade = valoresSelecionados.length;
    return `${quantidade} ${quantidade === 1 ? 'selecionado' : 'selecionados'}`;
  }

  const rotuloBotao = multiplo ? rotuloMultiplo() : selecionada?.rotulo ?? rotuloSelecionado ?? '';

  useEffect(() => {
    if (!aberto) return undefined;

    function fecharAoClicarFora(evento) {
      if (!containerRef.current?.contains(evento.target)) {
        setAberto(false);
      }
    }

    document.addEventListener('mousedown', fecharAoClicarFora);
    return () => document.removeEventListener('mousedown', fecharAoClicarFora);
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    listaRef.current?.querySelector('[data-ativa="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [aberto, indiceAtivo]);

  function abrir() {
    if (disabled) return;
    alterarTextoBusca('');
    setIndiceAtivo(multiplo ? 0 : Math.max(todasOpcoes.indexOf(selecionada), 0));
    setAberto(true);
  }

  function fechar() {
    setAberto(false);
    botaoRef.current?.focus();
  }

  function selecionar(opcao) {
    if (!multiplo) {
      aoAlterar(opcao.valor);
      fechar();
      return;
    }
    if (opcao === opcaoTodos) {
      aoAlterar([]);
      return;
    }
    const chave = String(opcao.valor);
    aoAlterar(valoresSelecionados.includes(chave)
      ? valoresSelecionados.filter((atual) => atual !== chave)
      : [...valoresSelecionados, chave]);
  }

  function alterarBusca(texto) {
    alterarTextoBusca(texto);
    setIndiceAtivo(0);
  }

  function teclarNoBotao(evento) {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault();
      abrir();
    }
  }

  function teclarNaBusca(evento) {
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      setIndiceAtivo((indice) => Math.min(indice + 1, opcoesFiltradas.length - 1));
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      setIndiceAtivo((indice) => Math.max(indice - 1, 0));
    } else if (evento.key === 'Enter') {
      evento.preventDefault();
      if (opcoesFiltradas[indiceAtivo]) selecionar(opcoesFiltradas[indiceAtivo]);
    } else if (evento.key === 'Escape') {
      evento.preventDefault();
      fechar();
    } else if (evento.key === 'Tab') {
      setAberto(false);
    }
  }

  return (
    <div className={styles.selectBusca} ref={containerRef}>
      <button
        ref={botaoRef}
        id={id}
        type="button"
        className={styles.botao}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={teclarNoBotao}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={rotuloBotao ? `${ariaLabel}: ${rotuloBotao}` : ariaLabel}
      >
        <span className={styles.rotulo}>{rotuloBotao}</span>
        <ChevronDown size={16} className={styles.seta} aria-hidden="true" />
      </button>

      {aberto && (
        <div className={styles.painel}>
          <div className={styles.campoBusca}>
            <Search size={14} className={styles.iconeBusca} aria-hidden="true" />
            <input
              type="text"
              className={styles.inputBusca}
              value={busca}
              onChange={(evento) => alterarBusca(evento.target.value)}
              onKeyDown={teclarNaBusca}
              placeholder={placeholderBusca}
              role="combobox"
              aria-label={placeholderBusca}
              aria-expanded="true"
              aria-controls={idLista}
              aria-activedescendant={opcoesFiltradas[indiceAtivo] ? `${idLista}-${indiceAtivo}` : undefined}
              autoFocus
            />
          </div>

          <ul
            ref={listaRef}
            id={idLista}
            className={styles.lista}
            role="listbox"
            aria-label={ariaLabel}
            aria-multiselectable={multiplo || undefined}
            aria-busy={carregando}
          >
            {opcoesFiltradas.map((opcao, indice) => {
              const marcada = estaSelecionada(opcao);

              return (
                <li
                  key={opcao.valor}
                  id={`${idLista}-${indice}`}
                  role="option"
                  aria-selected={marcada}
                  className={styles.opcao}
                  data-ativa={indice === indiceAtivo}
                  data-selecionada={marcada}
                  onMouseDown={(evento) => evento.preventDefault()}
                  onMouseEnter={() => setIndiceAtivo(indice)}
                  onClick={() => selecionar(opcao)}
                >
                  {multiplo && (
                    <span className={styles.marcador} data-marcado={marcada} aria-hidden="true">
                      {marcada && <Check size={12} />}
                    </span>
                  )}
                  {opcao.rotulo}
                </li>
              );
            })}
            {carregando && (
              <li className={styles.vazio} role="presentation">Carregando opções...</li>
            )}
            {!carregando && termo && opcoesEncontradas.length === 0 && (
              <li className={styles.vazio} role="presentation">{mensagemVazia}</li>
            )}
          </ul>

          {rodape && <p className={styles.rodape}>{rodape}</p>}
        </div>
      )}
    </div>
  );
}

export default SelectBusca;
