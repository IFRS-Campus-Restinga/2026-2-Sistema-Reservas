import { useState } from 'react';
import useListaPaginada from '../../hooks/useListaPaginada';
import SelectBusca from '../SelectBusca/SelectBusca';

export default function SelectRemoto({ url, valor, aoAlterar, aoSelecionar,
  filtros = {}, ariaLabel = 'Selecionar', valorTodos = '', rotuloTodos = 'Selecione',
  ativo = true, required = false, id, disabled = false, mostrarBusca = true, placeholderBusca,
  multiplo = false }) {
  const [busca, setBusca] = useState('');
  const [rotulosMarcados, setRotulosMarcados] = useState({});
  const lista = useListaPaginada(url, { ...filtros, busca }, ativo && !disabled);
  const temValor = !multiplo && valor !== undefined && valor !== null && String(valor) !== String(valorTodos);
  const selecionada = useListaPaginada(url, { id: valor }, ativo && temValor);
  const rotulo = (item) => item.nome || item.descricao || String(item.id);
  const opcoes = multiplo || lista.itens.some((item) => String(item.id) === String(valor))
    ? lista.itens : [...selecionada.itens, ...lista.itens];
  const erro = lista.erro || selecionada.erro;

  function selecionar(novoValor) {
    if (multiplo) {
      setRotulosMarcados((atuais) => {
        const novos = { ...atuais };
        lista.itens.forEach((item) => {
          if (novoValor.includes(String(item.id))) novos[item.id] = rotulo(item);
        });
        return novos;
      });
      aoAlterar(novoValor);
      return;
    }
    aoAlterar(novoValor);
    aoSelecionar?.(opcoes.find((item) => String(item.id) === String(novoValor)));
  }

  if (mostrarBusca || multiplo) {
    const marcados = multiplo ? (valor ?? []).map(String) : [];
    const itemSelecionado = multiplo ? null : opcoes.find((item) => String(item.id) === String(valor));
    const rotuloSelecionado = multiplo
      ? (marcados.length === 1 ? rotulosMarcados[marcados[0]] : undefined)
      : itemSelecionado && rotulo(itemSelecionado);
    const rodape = lista.total > lista.itens.length
      ? `Mostrando ${lista.itens.length} de ${lista.total}. Digite para refinar a busca.`
      : '';

    return (
      <div>
        <SelectBusca id={id} disabled={disabled} ariaLabel={ariaLabel} placeholderBusca={placeholderBusca}
          opcoes={lista.itens.map((item) => ({ valor: String(item.id), rotulo: rotulo(item) }))}
          valor={multiplo ? marcados : valor ?? valorTodos} valorTodos={valorTodos} rotuloTodos={rotuloTodos}
          multiplo={multiplo} aoAlterar={selecionar} busca={busca} aoBuscar={setBusca}
          carregando={lista.carregando} rodape={rodape} rotuloSelecionado={rotuloSelecionado} />
        {erro && <p role="alert">{erro}</p>}
      </div>
    );
  }

  return (
    <div>
      <select id={id} className="form-select" aria-label={ariaLabel}
        value={valor ?? valorTodos} required={required} disabled={disabled}
        onChange={(evento) => selecionar(evento.target.value)}>
        <option value={valorTodos}>{rotuloTodos}</option>
        {opcoes.map((item) => <option key={item.id} value={item.id}>{rotulo(item)}</option>)}
      </select>
      {lista.carregando && <small role="status">Carregando opções...</small>}
      {erro && <p role="alert">{erro}</p>}
    </div>
  );
}
