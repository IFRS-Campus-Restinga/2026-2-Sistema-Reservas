import {
  Home,
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