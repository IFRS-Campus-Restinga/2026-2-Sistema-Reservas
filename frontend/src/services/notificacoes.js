const URL = '/api/notificacoes/';

async function tratarResposta(resposta, mensagemPadrao) {
  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.detail || mensagemPadrao);
  }

  return dados;
}

// lida: 'true' | 'false' | '' (vazio = todas)
export async function listarNotificacoes(pagina = 1, signal, lida = '') {
  const filtro = lida ? `&lida=${lida}` : '';
  const resposta = await fetch(`${URL}?page=${pagina}&page_size=20${filtro}`, {
    signal,
    credentials: 'include',
  });

  return tratarResposta(
    resposta,
    'Não foi possível consultar as notificações.'
  );
}

export async function marcarNotificacaoComoLida(id) {
  const resposta = await fetch(`${URL}${id}/lida/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return tratarResposta(
    resposta,
    'Não foi possível marcar a notificação como lida.'
  );
}

export async function marcarTodasNotificacoesComoLidas() {
  const resposta = await fetch(`${URL}lidas/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return tratarResposta(
    resposta,
    'Não foi possível marcar todas as notificações como lidas.'
  );
}
