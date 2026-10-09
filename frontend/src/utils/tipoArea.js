import { Building2, DoorOpen, Dumbbell, Flame, FlaskConical, Monitor, Music, Presentation } from "lucide-react";

export const TIPO_AREA_LABEL = {
  SALA: "Sala de Aula",
  CONVENCIONAL: "Convencional",
  LABORATORIO: "Laboratório",
  INFORMATICA: "Informática",
  MUSICA: "Música",
  AUDITORIO: "Auditório",
  QUADRA: "Quadra",
  CHURRASQUEIRA: "Churrasqueira",
};

export const TIPO_AREA_ICONE = {
  SALA: DoorOpen,
  CONVENCIONAL: DoorOpen,
  LABORATORIO: FlaskConical,
  INFORMATICA: Monitor,
  MUSICA: Music,
  AUDITORIO: Presentation,
  QUADRA: Dumbbell,
  CHURRASQUEIRA: Flame,
};

export const ICONE_AREA_PADRAO = Building2;
