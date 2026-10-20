const URL = '/api/notificacoes/';

async function tratarResposta(resposta, mensagemPadrao) {
  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.detail || mensagemPadrao);
  }

  return dados;
}

export async function listarNotificacoes() {
  const resposta = await fetch(URL, {
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
