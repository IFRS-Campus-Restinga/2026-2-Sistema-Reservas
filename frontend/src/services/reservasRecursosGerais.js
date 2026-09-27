
const URL = '/api/reservas/recursos-gerais/';

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

export async function listarReservasRecursosGerais() {
  const resposta = await fetch(URL, {
    credentials: 'include',
  });

  return tratarResposta(resposta);
}

export async function criarReservaRecursoGeral(dados) {
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

export async function cancelarReservaRecursoGeral(id) {
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

export async function atualizarReservaRecursoGeral(id, dados) {
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

export async function consultarDisponibilidadeRecursoGeral(dados) {
  const parametros = new URLSearchParams(dados);

  const resposta = await fetch(
    `${URL}disponibilidade/?${parametros}`,
    { credentials: 'include' }
  );

  return tratarResposta(resposta);
}