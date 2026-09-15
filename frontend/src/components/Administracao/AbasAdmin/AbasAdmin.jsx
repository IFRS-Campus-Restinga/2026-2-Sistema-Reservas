function AbasAdmin({ abas, abaAtiva, aoSelecionar }) {
  return (
    <nav>
      {abas.map((aba) => (
        <button
          key={aba.id}
          type="button"
          onClick={() => aoSelecionar(aba.id)}
          data-ativa={abaAtiva === aba.id}
        >
          {aba.rotulo}
        </button>
      ))}
    </nav>
    /* nav é uma tag HTML para criar uma navegação */
  );
}

export default AbasAdmin;