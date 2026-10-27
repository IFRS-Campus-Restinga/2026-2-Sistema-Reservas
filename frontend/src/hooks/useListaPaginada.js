import { useCallback, useEffect, useState } from 'react';
import { consultarPagina, TAMANHO_PAGINA } from '../services/paginacao';
import useDebounce from './useDebounce';

// A chave inclui filtros: uma consulta nova sempre começa na primeira página.
export default function useListaPaginada(url, filtros = {}, ativo = true) {
  const chave = JSON.stringify(filtros);
  const consulta = useDebounce(chave);
  const chaveNavegacao = JSON.stringify([url, consulta]);
  const [navegacao, setNavegacao] = useState({ consulta: '', pagina: 1 });
  const [revisao, setRevisao] = useState(0);
  const [resposta, setResposta] = useState(null);
  const [erro, setErro] = useState('');
  const pagina = navegacao.consulta === chaveNavegacao ? navegacao.pagina : 1;
  const identidade = JSON.stringify([url, consulta, pagina, revisao]);
  const mudarPagina = useCallback((nova) => {
    setNavegacao({ consulta: chaveNavegacao, pagina: nova });
  }, [chaveNavegacao]);
  const recarregar = useCallback(() => setRevisao((valor) => valor + 1), []);

  useEffect(() => {
    if (!ativo || chave !== consulta) return;
    const controle = new AbortController();
    consultarPagina(url, { ...JSON.parse(consulta), page: pagina }, controle.signal)
      .then((dados) => {
        if (controle.signal.aborted) return;
        setResposta({ identidade, dados });
        setErro('');
      })
      .catch((falha) => {
        if (controle.signal.aborted) return;
        // Exclusão do último registro pode tornar a página atual inexistente.
        if (falha.response?.status === 404 && pagina > 1) {
          mudarPagina(1);
          return;
        }
        setResposta({ identidade, dados: { results: [], count: 0 } });
        setErro(falha.response?.data?.detail || 'Não foi possível carregar os dados.');
      });
    return () => controle.abort();
  }, [url, chave, consulta, pagina, revisao, identidade, ativo, mudarPagina]);

  const dados = ativo && chave === consulta && resposta?.identidade === identidade ? resposta.dados : null;
  const tamanho = filtros.page_size || TAMANHO_PAGINA;
  return {
    itens: dados?.results ?? [], total: dados?.count ?? 0,
    dados, erro, setErro, recarregar,
    carregando: ativo && (!dados || chave !== consulta),
    paginacao: { paginaAtual: pagina, totalPaginas: Math.ceil((dados?.count ?? 0) / tamanho),
      aoMudarPagina: mudarPagina },
  };
}
