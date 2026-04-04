import type { UserRole } from './roles';

export type ModuleId =
  | 'overview'
  | 'federaciones'
  | 'talento'
  | 'eventos'
  | 'padron'
  | 'evaluaciones'
  | 'misiones'
  | 'social'
  | 'atletas'
  | 'salud'
  | 'territorio';

export interface ModuleDef {
  id: ModuleId;
  label: string;
  icon: string; // lucide icon name
  description: string;
}

const MODULES: Record<ModuleId, ModuleDef> = {
  overview:     { id: 'overview',     label: 'Panel General',         icon: 'LayoutDashboard', description: 'Resumen y mapa geográfico' },
  federaciones: { id: 'federaciones', label: 'Auditoría Federativa',  icon: 'ShieldCheck',     description: 'Estado legal y técnico de federaciones' },
  talento:      { id: 'talento',      label: 'Monitor de Talento',    icon: 'Star',            description: 'Detección y seguimiento de talentos' },
  eventos:      { id: 'eventos',      label: 'Ciclo de Eventos',      icon: 'Calendar',        description: 'JADAR, Juegos CReAR y eventos federales' },
  padron:       { id: 'padron',       label: 'Padrón de Atletas',     icon: 'Users',           description: 'Legajo único de deportistas' },
  evaluaciones: { id: 'evaluaciones', label: 'Evaluaciones',          icon: 'ClipboardList',   description: 'Biometría y rendimiento físico' },
  misiones:     { id: 'misiones',     label: 'Proyección a Misiones', icon: 'Flag',            description: 'Long list y short list de selecciones' },
  social:       { id: 'social',       label: 'Inclusión Social',      icon: 'Heart',           description: 'Vulnerabilidad, escolaridad y bienestar' },
  atletas:      { id: 'atletas',      label: 'Gestión de Atletas',    icon: 'UserCheck',       description: 'Fichas, asistencia y seguimiento' },
  salud:        { id: 'salud',        label: 'Salud y Aptos',         icon: 'Stethoscope',     description: 'Aptos médicos y pasaporte sanitario' },
  territorio:   { id: 'territorio',   label: 'Gestión del Territorio', icon: 'MapPin',         description: 'Infraestructura y censo de instituciones' },
};

export const ROLE_MODULES: Record<UserRole, ModuleId[]> = {
  coa:          ['overview', 'federaciones', 'talento', 'eventos'],
  province:     ['overview', 'talento', 'social', 'eventos'],
  municipality: ['overview', 'territorio', 'atletas', 'social', 'salud'],
  federation:   ['overview', 'padron', 'evaluaciones', 'misiones'],
  club:         ['overview', 'atletas', 'evaluaciones', 'social', 'salud'],
};

export function getModulesForRole(role: UserRole): ModuleDef[] {
  return ROLE_MODULES[role].map((id) => MODULES[id]);
}
