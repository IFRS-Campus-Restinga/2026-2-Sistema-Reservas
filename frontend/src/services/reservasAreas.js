
const URL = '/api/reservas/areas/';

async function tratarResposta(resposta) {
  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const primeiroErro = Object.values(dados).flat()[0];

    const mensagem = typeof primeiroErro === 'string'
      ? primeiroErro
      : 'Não foi possível concluir a operação.';

    throw new Error(dados.detail || mensagem);
  }

  return dados;
}

export async function listarReservasAreas() {
  const resposta = await fetch(URL, {
    credentials: 'include',
  });

  return tratarResposta(resposta);
}

export async function listarMinhasReservasAreas() {
  const resposta = await fetch(`${URL}minhas/`, {
    credentials: 'include',
  });

  return tratarResposta(resposta);
}

export async function criarReservaArea(dados) {
  const resposta = await fetch(URL, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  });

  return tratarResposta(resposta);
}

export async function atualizarReservaArea(id, dados) {
  const resposta = await fetch(`${URL}${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  });

  return tratarResposta(resposta);
}

export async function cancelarReservaArea(id) {
  const resposta = await fetch(`${URL}${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'CANCELADA',
    }),
  });

  return tratarResposta(resposta);
}
