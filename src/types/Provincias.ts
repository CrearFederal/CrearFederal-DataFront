export interface ProvinciaRanking {
  id: number;
  nombre: string;
  totalAthletes: number;
  totalClubs: number;
  totalMujeres: number;
  totalHombres: number;
}

export interface ProvinciasTop10Response {
  provincias: ProvinciaRanking[];
}
