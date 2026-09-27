import { Boxes, Laptop, Package, Projector, Volleyball, Wrench } from "lucide-react";

export const CATEGORIA_RECURSO_LABEL = {
  INFORMATICA: "Informática",
  AUDIOVISUAL: "Audiovisual",
  MATERIAL_ESPORTIVO: "Material esportivo",
  FERRAMENTAS: "Ferramentas",
  MATERIAL_APOIO: "Material de apoio",
  OUTROS: "Outros",
};

export const CATEGORIA_RECURSO_ICONE = {
  INFORMATICA: Laptop,
  AUDIOVISUAL: Projector,
  MATERIAL_ESPORTIVO: Volleyball,
  FERRAMENTAS: Wrench,
  MATERIAL_APOIO: Boxes,
  OUTROS: Package,
};

export const ICONE_CATEGORIA_PADRAO = Package;
