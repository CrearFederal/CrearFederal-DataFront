export interface ClubConMasDeportistas {
  id_club: number;
  id_provincia: number;
  id_nodo: number;
  id_municipio: number;
  nombre: string;
  nombre_corto: string;
  totalDeportistas: number;
  logoUrl?: string | null;
  totalDeportes?: number;
}

export interface ClubesTotalesResponse {
  totalClubes: number;
  clubConMasDeportistas: ClubConMasDeportistas;
}

export interface TopClubRankingItem {
  id_club: number;
  nombre: string;
  nombre_corto?: string;
  nombreProvincia?: string;
  nombreMunicipio?: string;
  totalDeportistas: number;
}

export interface TopClubApiItem {
  id_club: number;
  nombreCorto: string;
  nombreProvincia: string;
  nombreMunicipio: string;
  cantidadDeportista: number;
}

export interface TopClubApiResponse {
  clubes: TopClubApiItem[];
}

export interface TopClubesDetalleItem {
  id_club: number;
  nombreCorto: string;
  nombreProvincia: string;
  nombreMunicipio: string;
  cantidadDeportista: number;
}

export interface TopClubesDetalleResponse {
  porcentaje: number;
  clubes: TopClubesDetalleItem[];
}

export interface ClubDetalleInfo {
  id_club: number;
  nombre: string;
  direccion: string;
  logoUrl: string | null;
  nombreMunicipio: string;
  nombreProvincia: string;
}

export interface InfraestructuraItem {
  id_tipo_infra: number;
  descripcion: string;
  categoria: string;
}

export interface ClubDetalleGeneroPorDeporte {
  deporte: string;
  masculino: number;
  femenino: number;
}

export interface EdadFrecuenciaItem {
  edad: number;
  cantidad: number;
}

export interface ConteoInfraestructura {
  CanchaFutbol: number;
  CanchaTenis: number;
  CanchaNatacion: number;
  CanchaBasquet: number;
  CanchaVoley: number;
  CanchaRugby: number;
  CanchaHockey: number;
  CanchaPadel: number;
  CanchaAtletismo: number;
  CanchaTiroConArco: number;
  CanchaHandball: number;
  CanchaFutsal: number;
  CanchaBochas: number;
  CanchaMultiples: number;
  Otros: number;
}

export interface ClubDetalleResponse {
  club: ClubDetalleInfo;
  totalDeportistas: number;
  totalDeportes: number;
  distribucionGenero: {
    masculino: number;
    femenino: number;
  };
  generoPorDeporte: ClubDetalleGeneroPorDeporte[];
  edadesFrecuencia: EdadFrecuenciaItem[];
  infraestructura?: InfraestructuraItem[];
  conteoInfraestructura?: ConteoInfraestructura;
}

export interface TipoInfraestructura {
  id_tipo_infra: number;
  descripcion: string;
  categoria: string;
}

export interface ClubPorInfraestructura {
  id_club: number;
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