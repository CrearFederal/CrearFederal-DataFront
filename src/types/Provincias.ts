export interface ProvinciaRanking {
  id: number;
  nombre: string;
  totalAthletes: number;
  totalClubs: number;
  totalMujeres: number;
  totalHombres: number;
  posicion: number;
}

export interface ProvinciasTop10ContextoResponse {
  provinciaLogueada: ProvinciaRanking | null;
  provincias: ProvinciaRanking[];
}
