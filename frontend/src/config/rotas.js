import {
  Home as IconeHome,
  Package,
  ClipboardList,
  Shield,
  Users,
  DoorOpen,
  Car
} from "lucide-react";

import Home from "../pages/Home/Home";
import Areas from "../pages/Areas/Areas";
import AreaDetalhe from "../pages/AreaDetalhe/AreaDetalhe";
import Veiculos from "../pages/Veiculos/Veiculos";
import VeiculoDetalhe from "../pages/VeiculoDetalhe/VeiculoDetalhe";
import Recursos from "../pages/Recursos/Recursos";
import MinhasReservas from "../pages/MinhasReservas/MinhasReservas";
import Grupos from "../pages/Grupos/Grupos";
import Administracao from "../pages/Administracao/Administracao";
import {
  ehAdministrador,
  podeGerenciarGrupos,
  podeReservarArea,
  podeReservarRecursoGeral,
  podeReservarVeiculo,
} from "../utils/permissoes";

export const ROTAS = [
  {
    id: "home",
    path: "/",
    componente: Home,
    menu: { titulo: "Home", icone: IconeHome },
  },
  {
    id: "areas",
    path: "/areas",
    componente: Areas,
    permissao: podeReservarArea,
    menu: { titulo: "Áreas", icone: DoorOpen },
  },
  {
    id: "area-detalhe",
    path: "/areas/:id",
    componente: AreaDetalhe,
    permissao: podeReservarArea,
  },
  {
    id: "veiculos",
    path: "/veiculos",
    componente: Veiculos,
    permissao: podeReservarVeiculo,
    menu: { titulo: "Veículos", icone: Car },
  },
  {
    id: "veiculo-detalhe",
    path: "/veiculos/:id",
    componente: VeiculoDetalhe,
    permissao: podeReservarVeiculo,
  },
  {
    id: "recursos",
    path: "/recursos",
    componente: Recursos,
    permissao: podeReservarRecursoGeral,
    menu: { titulo: "Recursos", icone: Package },
  },
  {
    id: "minhas-reservas",
    path: "/minhas-reservas",
    componente: MinhasReservas,
    menu: { titulo: "Minhas Reservas", icone: ClipboardList },
  },
  {
    id: "grupos",
    path: "/grupos",
    componente: Grupos,
    permissao: podeGerenciarGrupos,
    menu: { titulo: "Meus Grupos", icone: Users },
  },
  {
    id: "admin",
    path: "/admin",
    componente: Administracao,
    permissao: ehAdministrador,
    menu: { titulo: "Administração", icone: Shield },
  },
];

export const ITENS_MENU = ROTAS.filter((rota) => rota.menu);
