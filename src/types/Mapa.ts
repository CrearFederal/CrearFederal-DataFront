import type { ConteoInfraestructura } from "./Clubes";

export interface MapaClub {
  id_club: number;
  nombre: string;
  id_provincia: number;
  id_municipio: number;
  direccion: string;
  lat: number;
  lng: number;
  logoUrl?: string;
}

export interface MapaClubRaw {
  id_club: number;
  nombre: string;
  id_provincia: number;
  id_municipio: number;
  direccion: string;
  lat: string | number;
  lng: string | number;
  logoUrl?: string;
}

export interface ProvinciaResumen {
  id_provincia: number;
  nombre: string;
  totalClubs: number;
  totalAthletes: number;
  totalMunicipios: number;
  totalNodos: number;
  totalMujeres: number;
  totalHombres: number;
  totalFederaciones: number;
  polideportivos: Record<string, number>;
}

export interface ProvinciaResumenRaw {
  id_provincia: number;
  nombre: string;
  totalClubes: number;
  totalDeportistas: number;
  totalMunicipios: number;
  totalNodos: number;
  totalMujeres: number;
  totalHombres: number;
  totalFederaciones: number;
  polideportivos: Record<string, number>;
}

export interface Polideportivo {
  id: number;
  nombre: string;
  id_provincia: number;
  id_nodo: number;
  id_municipio: number;
  direccion: string;
  lat: number;
  lng: number;
  logoUrl: string | null;
}

export interface PolideportivoRaw {
  id: number;
  nombre: string;
  id_provincia: number;
  id_nodo: number;
  id_municipio: number;
  direccion: string;
  lat: string | number;
  lng: string | number;
  logoUrl: string | null;
}

export interface ClubLogo {
  id_club: number;
  logoUrl: string | null;
}

export interface ClubLogosResponse {
  logos: ClubLogo[];
}

export interface PolideportivoLogo {
  id: number;
  logoUrl: string | null;
}

export interface PolideportivoLogosResponse {
  logos: PolideportivoLogo[];
}

export interface InfraestructuraItem {
  id_tipo_infra: number;
  descripcion: string;
  categoria: string;
}

export interface PolideportivoDetalle {
  id: number;
  tipo: string;
  nombre: string;
  direccion: string;
  logoUrl: string | null;
  nombreMunicipio: string;
  nombreProvincia: string;
}

export interface PolideportivoDetalleResponse {
  polideportivo: PolideportivoDetalle;
  infraestructura: InfraestructuraItem[];
  conteoInfraestructura: ConteoInfraestructura;
}

export interface PolideportivoPorInfraestructura {
  id: number;
  nombre: string;
  id_provincia: number;
  nombreProvincia: string;
  id_municipio: number;
  nombreMunicipio: string;
  direccion: string;
  lat: number | null;
  lng: number | null;
  logoUrl: string | null;
}

export interface Federacion {
  id: number;
  nombre: string;
  nombreCorto: string;
  id_provincia: number;
  nombreProvincia: string;
  direccion: string;
  lat: number;
  lng: number;
  nivel_alcance: string;
  nombreNivel: string;
  logoUrl: string | null;
}

export interface FederacionRaw {
  id: number;
  nombre: string;
  nombreCorto: string;
  id_provincia: number;
  nombreProvincia: string;
  direccion: string;
  lat: string | number;
  lng: string | number;
  nivel_alcance: string;
  nombreNivel: string;
  logoUrl: string | null;
}

export interface FederacionLogo {
  id: number;
  logoUrl: string | null;
}

export interface FederacionLogosResponse {
  logos: FederacionLogo[];
}

export interface FederacionDeporte {
  id_deporte: number;
  nombre: string;
  esPrincipal: boolean;
}

export interface FederacionMunicipio {
  id_municipio: number;
  nombre: string;
}

export interface FederacionDetalle {
  id: number;
  nombre: string;
  nombreCorto: string;
  direccion: string;
  telefono: string;
  whatsapp: string;
  mail: string;
  responsable: string;
  logoUrl: string | null;
  nivel_alcance: string;
  nombreNivel: string;
  id_provincia: number;
  nombreProvincia: string;
  personeria_juridica: string;
  nro_personeria: string;
  fecha_otorgada: string | null;
}

export interface FederacionDetalleResponse {
  federacion: FederacionDetalle;
  deportes: FederacionDeporte[];
  municipios: FederacionMunicipio[];
  totalDeportistas: number;
}