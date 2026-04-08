export interface Provincia {
  id_provincia: number;
  nombre: string;
}

export interface Municipio {
  id_municipio: number;
  nombre: string;
  id_provincia: number;
}

export interface Club {
  id_club: number;
  nombre: string;
  id_provincia: number;
  id_municipio: number;
  direccion: string;
  lat: number;
  lng: number;
  logoUrl?: string;
}

export interface Deportista {
  id_deportista: number;
  sexo: 'M' | 'F';
  fecha_nac: string;
  id_provincia: number;
  id_municipio: number;
}

export interface Deporte {
  id_deporte: number;
  nombre: string;
}

export interface PerfilDeportivo {
  id_deportista: number;
  id_deporte: number;
  id_club: number;
}

export type NavigationLevel = 'country' | 'province' | 'city' | 'club';

export interface NavigationState {
  level: NavigationLevel;
  provinciaId?: number;
  municipioId?: number;
  clubId?: number;
}

export interface Filters {
  sports: number[];
  gender: ('M' | 'F')[];
  ageRange: [number, number];
}
