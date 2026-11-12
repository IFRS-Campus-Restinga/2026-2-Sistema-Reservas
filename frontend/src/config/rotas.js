import { lazy } from "react";
import {
  Home as IconeHome,
  Package,
  ClipboardList,
  Shield,
  Users,
  DoorOpen,
  Car,
  CalendarDays,
  Bell,
} from "lucide-react";

const Home = lazy(() => import("../pages/Home/Home"));
const Areas = lazy(() => import("../pages/Areas/Areas"));
const AreaDetalhe = lazy(() => import("../pages/AreaDetalhe/AreaDetalhe"));
const Calendario = lazy(() => import("../pages/Calendario/Calendario"));
const Veiculos = lazy(() => import("../pages/Veiculos/Veiculos"));
const VeiculoDetalhe = lazy(() => import("../pages/VeiculoDetalhe/VeiculoDetalhe"));
const Recursos = lazy(() => import("../pages/Recursos/Recursos"));
const MinhasReservas = lazy(() => import("../pages/MinhasReservas/MinhasReservas"));
const Grupos = lazy(() => import("../pages/Grupos/Grupos"));
const Administracao = lazy(() => import("../pages/Administracao/Administracao"));
const Notificacoes = lazy(() => import("../pages/Notificacoes/Notificacoes"));
import {
  ehAdministrador,
  podeGerenciarGrupos,
  podeReservarAlgo,
  podeReservarArea,
  podeReservarRecursoGeral,
  podeReservarVeiculo,
  podeVerMinhasReservas,
} from "../utils/permissoes";

export const ROTAS = [
  {
    id: "home",
    path: "/",
    componente: Home,
    permissao: podeReservarAlgo,
    menu: { titulo: "Home", icone: IconeHome },
  },
  {
    id: "calendario",
    path: "/calendario",
    componente: Calendario,
    publica: true,
    menu: { titulo: "Calendário", icone: CalendarDays },
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
    permissao: podeVerMinhasReservas,
    menu: { titulo: "Minhas Reservas", icone: ClipboardList },
  },
  {
    id: "notificacoes",
    path: "/notificacoes",
    componente: Notificacoes,
    permissao: podeVerMinhasReservas,
    menu: {
      titulo: "Notificações",
      icone: Bell,
    },
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

// Quem não pode reservar nada (inclusive visitantes) começa pelo calendário.
export const rotaInicial = (usuario) => (podeReservarAlgo(usuario) ? "/" : "/calendario");
