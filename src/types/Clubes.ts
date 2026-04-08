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