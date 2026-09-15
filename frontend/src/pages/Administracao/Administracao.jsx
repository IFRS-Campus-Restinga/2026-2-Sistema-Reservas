import { useState } from "react";

import AbasAdmin from "../../components/Administracao/AbasAdmin/AbasAdmin";
import VeiculosAdmin from "../../components/Administracao/Veiculos/VeiculosAdmin";

const abas = [
  {
    id: "visao-geral",
    rotulo: "Visão Geral",
  },
  {
    id: "veiculos",
    rotulo: "Veículos",
  }
];

function Administracao() {
  const [abaAtiva, setAbaAtiva] = useState("visao-geral");

  return (
    <div>
      <div>
        <span>Painel administrativo · acesso restrito</span>
      </div>

      <AbasAdmin
        abas={abas}
        abaAtiva={abaAtiva}
        aoSelecionar={setAbaAtiva}
      />

      <main>
        {abaAtiva === "visao-geral" && (
          <p>Visão geral da administração.</p>
        )}

        {abaAtiva === "veiculos" && (
          <VeiculosAdmin />
        )}
      </main>
    </div>
  );
}

export default Administracao;
