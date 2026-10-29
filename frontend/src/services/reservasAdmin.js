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

export async function listarReservasAdmin(
  parametros = {},
  signal
) {
  const query = new URLSearchParams();

  Object.entries(parametros).forEach(
    ([chave, valor]) => {
      if (
        valor !== undefined &&
        valor !== null &&
        valor !== ''
      ) {
        query.set(chave, valor);
      }
    }
  );

  const resposta = await fetch(
    `${URL}?${query.toString()}`,
    {
      credentials: 'include',
      signal,
    }
  );

  return tratarResposta(resposta);
}
