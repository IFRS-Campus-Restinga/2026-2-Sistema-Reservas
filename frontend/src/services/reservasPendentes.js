const URL = '/api/reservas/pendentes/';

async function tratarResposta(resposta, mensagemPadrao) {
  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const primeiroErro = Object.values(dados).flat()[0];
    const mensagem = typeof primeiroErro === 'string'
      ? primeiroErro
      : mensagemPadrao;

    throw new Error(dados.detail || mensagem);
  }

  return dados;
}

export async function listarReservasPendentes() {
  const resposta = await fetch(URL, {
    credentials: 'include',
  });

  return tratarResposta(resposta, 'Não foi possível consultar as reservas pendentes.');
}

export async function confirmarReservaPendente(id) {
  const resposta = await fetch(`${URL}${id}/confirmar/`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return tratarResposta(
    resposta,
    'Não foi possível confirmar a reserva.'
  );
}
