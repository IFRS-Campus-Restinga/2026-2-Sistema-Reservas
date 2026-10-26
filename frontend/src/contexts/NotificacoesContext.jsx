import {
  createContext,
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  listarNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
} from '../services';

export const NotificacoesContext = createContext(null);

export function NotificacoesProvider({ children }) {
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const carregarNotificacoes = useCallback(async () => {
    try {
      setCarregando(true);
      setErro('');

      const dados = await listarNotificacoes();

      setNotificacoes(dados.notificacoes || []);
      setNaoLidas(dados.nao_lidas || 0);
    } catch (falha) {
      setErro(
        falha.message ||
          'Não foi possível carregar as notificações.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarNotificacoes();
  }, [carregarNotificacoes]);

  async function marcarComoLida(id) {
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
      Math.max(0, quantidade - 1)
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
      }}
    >
      {children}
    </NotificacoesContext.Provider>
  );
}