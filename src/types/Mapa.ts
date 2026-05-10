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
}

export interface ClubLogo {
  id_club: number;
  logoUrl: string | null;
}

export interface ClubLogosResponse {
  logos: ClubLogo[];
}