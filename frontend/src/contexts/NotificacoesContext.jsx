import { useEffect, useState } from 'react';
import { NotificacoesContext } from './notificacoes-context';

import {
  listarNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
} from '../services';

export function NotificacoesProvider({ children, usuario }) {
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [carregando, setCarregando] = useState(Boolean(usuario));
  const [erro, setErro] = useState('');
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);

  const [revisao, setRevisao] = useState(0);

  function carregarNotificacoes() {
    setCarregando(true);
    setErro('');
    setRevisao((valor) => valor + 1);
  }

  function mudarPagina(valor) {
    setCarregando(true);
    setErro('');
    setPagina(valor);
  }

  useEffect(() => {
    if (!usuario) return;
    const controle = new AbortController();
    listarNotificacoes(pagina, controle.signal)
      .then((dados) => {
        if (controle.signal.aborted) return;
        setNotificacoes(dados.results || []);
        setTotal(dados.count || 0);
        setNaoLidas(dados.nao_lidas || 0);
      })
      .catch((falha) => {
        if (!controle.signal.aborted) setErro(falha.message || 'N?o foi poss?vel carregar as notifica??es.');
      })
      .finally(() => { if (!controle.signal.aborted) setCarregando(false); });
    return () => controle.abort();
  }, [usuario, pagina, revisao]);

  async function marcarComoLida(id) {
    const jaLida = notificacoes.find((item) => item.id === id)?.lida;
    const atualizada =
      await marcarNotificacaoComoLida(id);

    setNotificacoes((atuais) =>
      atuais.map((item) =>
        item.id === atualizada.id
          ? atualizada
          : item
      )
    );

    setNaoLidas((quantidade) =>
      Math.max(0, quantidade - (jaLida ? 0 : 1))
    );

    return atualizada;
  }

  async function marcarTodasComoLidas() {
    await marcarTodasNotificacoesComoLidas();

    setNotificacoes((atuais) =>
      atuais.map((notificacao) => ({
        ...notificacao,
        lida: true,
      }))
    );

    setNaoLidas(0);
  }

  return (
    <NotificacoesContext.Provider
      value={{
        notificacoes,
        naoLidas,
        carregando,
        erro,
        carregarNotificacoes,
        marcarComoLida,
        marcarTodasComoLidas,
        paginacao: { paginaAtual: pagina, totalPaginas: Math.ceil(total / 20), aoMudarPagina: mudarPagina },
      }}
    >
      {children}
    </NotificacoesContext.Provider>
  );
}
