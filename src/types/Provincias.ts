export interface ProvinciaRanking {
  id: number;
  nombre: string;
  totalAthletes: number;
  totalClubs: number;
}

export interface ProvinciasTop10Response {
  provincias: ProvinciaRanking[];
}
