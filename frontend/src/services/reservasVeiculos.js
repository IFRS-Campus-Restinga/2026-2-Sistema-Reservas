const URL = '/api/reservas/veiculos/';

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

export async function listarReservasVeiculos() {
  const resposta = await fetch(URL, { credentials: 'include' });
  return tratarResposta(resposta);
}

export async function criarReservaVeiculo(dados) {
  const resposta = await fetch(URL, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

export async function atualizarReservaVeiculo(id, dados) {
  const resposta = await fetch(`${URL}${id}/`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
  return tratarResposta(resposta);
}

export async function cancelarReservaVeiculo(id) {
  return atualizarReservaVeiculo(id, { status: 'CANCELADA' });
}

export async function consultarDisponibilidadeVeiculo(dados) {
  const parametros = new URLSearchParams(dados);
  const resposta = await fetch(`${URL}disponibilidade/?${parametros}`, {
    credentials: 'include',
  });
  return tratarResposta(resposta);
}

export async function buscarAgendaVeiculo(id) {
  const parametros = new URLSearchParams({ tipo: 'VEICULO', recurso: id });
  const resposta = await fetch(`/api/reservas/agenda/?${parametros}`, {
    credentials: 'include',
  });
  return tratarResposta(resposta);
}
