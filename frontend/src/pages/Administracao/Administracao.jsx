import { useState } from "react";
import { Shield } from "lucide-react";
import styles from "./Administracao.module.css";

import AbasAdmin from "../../components/Administracao/AbasAdmin/AbasAdmin";
import VeiculosAdmin from "../../components/Administracao/Veiculos/VeiculosAdmin";
import ReservasAdmin from "../../components/Administracao/Reservas/ReservasAdmin";
import RecursosAdmin from "../../components/Administracao/Recursos/RecursosAdmin";
import BlocosAdmin from "../../components/Administracao/Blocos/BlocosAdmin";
import AreasAdmin from "../../components/Administracao/Areas/AreasAdmin";
import TimetableAdmin from "../../components/Administracao/Timetable/TimetableAdmin";
import GruposGerenciador from "../../components/Grupos/GruposGerenciador/GruposGerenciador";
import AuditoriaAdmin from "../../components/Administracao/Auditoria/AuditoriaAdmin";
import SolicitacoesAdmin from "../../components/Administracao/Solicitacoes/SolicitacoesAdmin";

const abas = [
  {
    id: "visao-geral",
    rotulo: "Visão Geral",
  },
  { 
    id: "solicitacoes", 
    rotulo: "Solicitações" 
  },
  {
    id: "reservas",
    rotulo: "Reservas",
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
  },
  {
    id: "grupos",
    rotulo: "Grupos",
  },
  {
    id: "timetable",
    rotulo: "Timetable",
  },
  {
    id: "auditoria",
    rotulo: "Auditoria",
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
        {abaAtiva === "solicitacoes" && <SolicitacoesAdmin />}
        {abaAtiva === "visao-geral" && (
          <p className={styles.visaoGeral}>
            Visão geral da administração.
          </p>
        )}

        {abaAtiva === "reservas" && (
                  <ReservasAdmin />
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

        {abaAtiva === "grupos" && (
          <GruposGerenciador />
        )}
        
        {abaAtiva === "timetable" && (
          <TimetableAdmin />)}

        {abaAtiva === "auditoria" && (
          <AuditoriaAdmin />
        )}
      </div>
    </div>
  );
}

export default Administracao;
