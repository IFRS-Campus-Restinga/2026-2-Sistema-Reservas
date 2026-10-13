async function requisitar(url, opcoes = {}) {
  const resposta = await fetch(url, { credentials: 'include', ...opcoes });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const mensagens = Object.values(dados).flat();
    throw new Error(dados.detail || mensagens.find((valor) => typeof valor === 'string') || 'Não foi possível processar o termo.');
  }
  return dados;
}

export function buscarTermo(id) {
  return requisitar(`/api/reservas/${id}/termo/`);
}

export function enviarTermo(id, arquivo) {
  const dados = new FormData();
  dados.append('arquivo', arquivo);
  return requisitar(`/api/reservas/${id}/termo/`, { method: 'POST', body: dados });
}

export function analisarTermo(id, termoId, status, motivo) {
  return requisitar(`/api/reservas/${id}/termo/analise/`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ termo_id: termoId, status, motivo }),
  });
}

export function listarSolicitacoes(parametros, signal) {
  return requisitar(`/api/solicitacoes/termos/?${new URLSearchParams(parametros)}`, { signal });
}

export function buscarTermoOperacional(id, tipo) {
  return requisitar(`/api/reservas/${id}/termo-operacional/${tipo}/`);
}

export function enviarTermoOperacional(id, tipo, arquivo) {
  const dados = new FormData();
  dados.append('arquivo', arquivo);
  return requisitar(`/api/reservas/${id}/termo-operacional/${tipo}/`, { method: 'POST', body: dados });
}

export function analisarTermoOperacional(id, tipo, termoId, status, motivo) {
  return requisitar(`/api/reservas/${id}/termo-operacional/${tipo}/analise/`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ termo_id: termoId, status, motivo }),
  });
}
