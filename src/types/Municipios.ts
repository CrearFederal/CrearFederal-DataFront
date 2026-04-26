export interface MunicipioRanking {
	id: number;
	codigopostal: string | null;
	nombre: string;
	totalAthletes: number;
	totalClubs: number;
	totalMujeres: number;
	totalHombres: number;
	posicion: number;
}

export interface MunicipiosTop10ContextoResponse {
	municipioLogueado: MunicipioRanking | null;
	municipios: MunicipioRanking[];
}
