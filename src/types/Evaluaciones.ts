export interface EvaluacionesMunicipioItem {
	id_municipio: number;
	codigopostal: string;
	nombre: string;
	evaluacionesTotales: number;
	evaluacionesTotalesAnterior: number;
	actualVsAnterior: number;
}

export interface EvaluacionesMunicipiosResponse {
	municipios: EvaluacionesMunicipioItem[];
}

export interface EvaluacionesMunicipioTop10Item {
	id_municipio: number;
	codigopostal: string;
	nombre: string;
	evaluacionesTotales: number;
	evaluacionesTotalesAnterior: number;
	actualVsAnterior: number;
}

export interface EvaluacionesMunicipiosTop10Response {
	municipios: EvaluacionesMunicipioTop10Item[];
}

export interface EvaluacionesEvolucionMensualItem {
	mes: string;
	cantidadEvaluaciones: number;
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
