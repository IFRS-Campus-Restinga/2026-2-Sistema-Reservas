import {
  Home,
  Package,
  ClipboardList,
  Shield,
  Users,
} from "lucide-react";

export const MENU = [
  {
    id: "home",
    titulo: "Home",
    icone: Home,
    url: '/',
    permissoes: true,
  },
  {
    id: "recursos",
    titulo: "Recursos",
    icone: Package,
    url: "/recursos",
    permissoes: true,
  },
  {
    id: 'minhas-reservas',
    titulo: 'Minhas Reservas',
    icone: ClipboardList,
    url: '/minhas-reservas',
    permissoes: true,
  },
  {
    id: "grupos",
    titulo: "Grupos",
    icone: Users,
    url: '/grupos',
    permissoes: true,
  },
  {
    id: "admin",
    titulo: "Administração",
    icone: Shield,
    url: '/admin',
    permissoes: true,
  },
];