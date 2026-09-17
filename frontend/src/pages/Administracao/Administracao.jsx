import { useState } from "react";
import { Shield } from "lucide-react";
import styles from "./Administracao.module.css";

import AbasAdmin from "../../components/Administracao/AbasAdmin/AbasAdmin";
import VeiculosAdmin from "../../components/Administracao/Veiculos/VeiculosAdmin";
import RecursosAdmin from "../../components/Administracao/Recursos/RecursosAdmin";
import BlocosAdmin from "../../components/Administracao/Blocos/BlocosAdmin";
import AreasAdmin from "../../components/Administracao/Areas/AreasAdmin";

const abas = [
  {
    id: "visao-geral",
    rotulo: "Visão Geral",
  },
  {
    id: "recursos",
    rotulo: "Recursos",
  },
  {
    id: "veiculos",
    rotulo: "Veículos",
  },
  {
    id: "blocos",
    rotulo: "Blocos",
  },
  {
    id: "areas",
    rotulo: "Áreas",
  }
];

function Administracao() {
  const [abaAtiva, setAbaAtiva] = useState("visao-geral");

  return (
    <div className={styles.pagina}>
      <div className={styles.faixaAdministrativa}>
        <Shield size={14} aria-hidden="true" />
        <span>Painel administrativo · acesso restrito</span>
      </div>

      <AbasAdmin
        abas={abas}
        abaAtiva={abaAtiva}
        aoSelecionar={setAbaAtiva}
      />

      <div className={styles.conteudo}>
        {abaAtiva === "visao-geral" && (
          <p className={styles.visaoGeral}>
            Visão geral da administração.
          </p>
        )}

        {abaAtiva === "recursos" && (
          <RecursosAdmin />
        )}

        {abaAtiva === "veiculos" && (
          <VeiculosAdmin />
        )}

        {abaAtiva === "blocos" && (
          <BlocosAdmin />
        )}

        {abaAtiva === "areas" && (
          <AreasAdmin />
        )}
      </div>
    </div>
  );
}

export default Administracao;