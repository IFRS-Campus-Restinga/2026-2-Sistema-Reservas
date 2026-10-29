import axios from 'axios';

export const TAMANHO_PAGINA = 20;

export async function consultarPagina(url, parametros = {}, signal) {
  const { data } = await axios.get(url, {
    params: { page_size: TAMANHO_PAGINA, ...parametros },
    signal,
    withCredentials: true,
  });
  return data;
}

// Compatibilidade para fluxos que precisam do catálogo completo, como o calendário.
export async function consultarTodasPaginas(url, parametros = {}, signal) {
  const itens = [];
  let pagina = 1;

  while (true) {
    const dados = await consultarPagina(url, { ...parametros, page: pagina, page_size: 100 }, signal);
    itens.push(...dados.results);

    if (!dados.next) return itens;
    pagina += 1;
  }
}
