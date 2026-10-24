const URL = '/api/reservas/admin/';

async function tratarResposta(resposta) {
  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const primeiroErro = Object.values(dados).flat()[0];

    throw new Error(
      dados.detail ||
      primeiroErro ||
      'Não foi possível carregar as reservas.'
    );
  }

  return dados;
}

export async function listarReservasAdmin() {
  const resposta = await fetch(URL, {
    credentials: 'include',
  });

  return tratarResposta(resposta);
}