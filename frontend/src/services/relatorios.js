export async function gerarRelatorioUso(filtros) {
  const parametros = new URLSearchParams(
    Object.entries(filtros).filter(([, valor]) => valor !== '' && valor !== false && valor != null)
  );
  if (filtros.incluir_canceladas) parametros.set('incluir_canceladas', 'true');
  const resposta = await fetch(`/api/relatorios/uso/?${parametros}`, { credentials: 'include' });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const mensagem = Object.values(dados).flat()[0];
    throw new Error(dados.detail || mensagem || 'Não foi possível gerar o relatório.');
  }
  return dados;
}
