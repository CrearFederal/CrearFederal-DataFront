export interface ClubConMasDeportistas {
  id_club: number;
  id_provincia: number;
  id_nodo: number;
  id_municipio: number;
  nombre: string;
  nombre_corto: string;
  totalDeportistas: number;
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
  nombreCorto: string;
  nombreProvincia: string;
  nombreMunicipio: string;
  cantidadDeportista: number;
}

export interface TopClubApiResponse {
  clubes: TopClubApiItem[];
}