import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
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
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const containerRef = useRef(null);
  const botaoRef = useRef(null);
  const listaRef = useRef(null);
  const idLista = useId();

  const opcaoTodos = valorTodos !== undefined && rotuloTodos ? [{ valor: valorTodos, rotulo: rotuloTodos }] : [];
  const todasOpcoes = [...opcaoTodos, ...opcoes];
  const termo = normalizar(busca.trim());
  const opcoesEncontradas = opcoes.filter((opcao) => normalizar(opcao.rotulo).includes(termo));
  const opcoesFiltradas = [...opcaoTodos, ...opcoesEncontradas];
  const selecionada = todasOpcoes.find((opcao) => String(opcao.valor) === String(valor));

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
    setBusca('');
    setIndiceAtivo(Math.max(todasOpcoes.indexOf(selecionada), 0));
    setAberto(true);
  }

  function fechar() {
    setAberto(false);
    botaoRef.current?.focus();
  }

  function selecionar(opcao) {
    aoAlterar(opcao.valor);
    fechar();
  }

  function alterarBusca(texto) {
    setBusca(texto);
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
        type="button"
        className={styles.botao}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={teclarNoBotao}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-label={ariaLabel}
      >
        <span className={styles.rotulo}>{selecionada?.rotulo ?? ''}</span>
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

          <ul ref={listaRef} id={idLista} className={styles.lista} role="listbox" aria-label={ariaLabel}>
            {opcoesFiltradas.map((opcao, indice) => (
              <li
                key={opcao.valor}
                id={`${idLista}-${indice}`}
                role="option"
                aria-selected={opcao === selecionada}
                className={styles.opcao}
                data-ativa={indice === indiceAtivo}
                data-selecionada={opcao === selecionada}
                onMouseDown={(evento) => evento.preventDefault()}
                onMouseEnter={() => setIndiceAtivo(indice)}
                onClick={() => selecionar(opcao)}
              >
                {opcao.rotulo}
              </li>
            ))}
            {termo && opcoesEncontradas.length === 0 && (
              <li className={styles.vazio} role="presentation">{mensagemVazia}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SelectBusca;
