export async function consultarOpcoesDisponibilidade(parametros, signal) {
  const consulta = new URLSearchParams(parametros);
  const resposta = await fetch(`/api/reservas/disponibilidade/opcoes/?${consulta}`, {
    credentials: 'include', signal,
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.detail || 'Não foi possível consultar a disponibilidade.');
  return dados;
}
