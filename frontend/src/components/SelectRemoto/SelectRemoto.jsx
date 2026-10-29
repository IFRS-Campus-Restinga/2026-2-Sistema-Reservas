import { useState } from 'react';
import useListaPaginada from '../../hooks/useListaPaginada';

// Busca e navegação também nos seletores, sem baixar o catálogo inteiro.
export default function SelectRemoto({ url, valor, aoAlterar, aoSelecionar,
  filtros = {}, ariaLabel = 'Selecionar', valorTodos = '', rotuloTodos = 'Selecione',
  ativo = true, required = false, id, disabled = false, mostrarBusca = true }) {
  const [busca, setBusca] = useState('');
  const lista = useListaPaginada(url, { ...filtros, busca }, ativo && !disabled);
  const temValor = valor !== undefined && valor !== null && String(valor) !== String(valorTodos);
  const selecionada = useListaPaginada(url, { id: valor }, ativo && temValor);
  const rotulo = (item) => item.nome || item.descricao || String(item.id);
  const opcoes = lista.itens.some((item) => String(item.id) === String(valor))
    ? lista.itens : [...selecionada.itens, ...lista.itens];

  return (
    <div>
      {mostrarBusca && (
        <input type="search" className="form-control mb-1" value={busca}
          aria-label={`Buscar: ${ariaLabel}`} placeholder="Buscar..."
          disabled={disabled} onChange={(evento) => setBusca(evento.target.value)} />
      )}
      <select id={id} className="form-select" aria-label={ariaLabel}
        value={valor ?? valorTodos} required={required} disabled={disabled}
        onChange={(evento) => {
          aoAlterar(evento.target.value);
          aoSelecionar?.(opcoes.find((item) => String(item.id) === evento.target.value));
        }}>
        <option value={valorTodos}>{rotuloTodos}</option>
        {opcoes.map((item) => <option key={item.id} value={item.id}>{rotulo(item)}</option>)}
      </select>
      {lista.carregando && <small role="status">Carregando opções...</small>}
      {(lista.erro || selecionada.erro) && <p role="alert">{lista.erro || selecionada.erro}</p>}
    </div>
  );
}
