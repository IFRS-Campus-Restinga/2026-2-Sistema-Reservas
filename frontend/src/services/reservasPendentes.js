const URL = '/api/reservas/pendentes/';

async function tratarResposta(resposta) {
  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const primeiroErro = Object.values(dados).flat()[0];
    const mensagem = typeof primeiroErro === 'string'
      ? primeiroErro
      : 'Não foi possível consultar as reservas pendentes.';

    throw new Error(dados.detail || mensagem);
  }

  return dados;
}

export async function listarReservasPendentes() {
  const resposta = await fetch(URL, {
    credentials: 'include',
  });

  return tratarResposta(resposta);
}
