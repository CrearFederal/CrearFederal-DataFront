export interface EvaluacionesMunicipioTop10Item {
	id_municipio: number;
	codigopostal: string;
	nombre: string;
	evaluacionesTotales: number;
	evaluacionesTotalesAnterior: number;
	actualVsAnterior: number;
}

export interface EvaluacionesProvinciaTop10Item {
	id_provincia: number;
	nombre: string;
	personasTotales: number;
	personasTotalesAnterior: number;
	actualVsAnterior: number;
}

export interface EvaluacionesMunicipiosTop10Response {
	municipios: EvaluacionesMunicipioTop10Item[];
}

export interface EvaluacionesProvinciasTop10Response {
	provincias: EvaluacionesProvinciaTop10Item[];
}

export interface EvaluacionesEvolucionMensualItem {
	mes: string;
	cantidadEvaluados: number;
	actualVsAnterior: number;
}

export interface EvaluacionesEvolucionMensualResponse {
	evolucion: EvaluacionesEvolucionMensualItem[];
}

export interface EvaluacionesPorNivelItem {
	nivel_evaluado: string;
	cantidad: number;
	porcentaje?: number;
}

export interface EvaluacionesPorNivelResponse {
	niveles: EvaluacionesPorNivelItem[];
}

export interface EvaluacionesDistribucionGeneroResponse {
	masculinoCantidad: number;
	masculinoPorc: number;
	femeninoCantidad: number;
	femeninoPorc: number;
}

export interface EvaluacionesResumenResponse {
	evaluacionesTotales: number;
	evaluacionesAnterior: number;
	evaluacionesVsAnteriorPct: number;
	lotesTotales: number;
	lotesAnterior: number;
	lotesVsAnteriorPct: number;
	personasEvaluadas: number;
	mesActual: string;
	personasAnterior: number;
	mesAnterior: string;
	personasVsAnteriorPct: number;
	totalMunicipios: number;
	municipiosAlcanzados: number;
	municipiosVsTotalPct: number;
}

export interface AptitudValorItem {
	idTest: number[];
	aptitudEvaluada: string;
	valor: number;
}

export interface DeportistaEvaluadoItem {
	idDeportista: number;
	nombre: string;
	club: string;
	deporte: string;
	edad: number;
	genero: string;
	provincia: string;
	municipio: string;
	medianaTest: number;
	valoresTest: AptitudValorItem[];
}

export interface DeportistasEvaluadosResponse {
	deportistas: DeportistaEvaluadoItem[];
	medianas: AptitudValorItem[];
}

export interface DeportistasEvaluadosParams {
	idDeporte: number;
	idProvincia: number;
	edadMin: number;
	edadMax: number;
	genero?: "M" | "F";
	idClub?: number;
	idMunicipio?: number;
	nivelEvaluado?: string;
}
