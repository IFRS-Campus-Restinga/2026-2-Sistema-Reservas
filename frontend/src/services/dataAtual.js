export async function buscarDataAtual() {
  const resposta = await fetch('/api/data-atual/', { credentials: 'include' });
  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    throw new Error(dados.detail || 'Não foi possível obter a data atual.');
  }

  return dados;
}
