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
	evaluacionesVsAnteriorPct: number | null;
	clubesAlcanzados: number;
	clubesAlcanzadosAnterior: number;
	clubesAlcanzadosVsAnteriorPct: number | null;
	lotesTotales: number;
	lotesAnterior: number;
	lotesVsAnteriorPct: number | null;
	personasEvaluadas: number;
	mesActual: string;
	personasAnterior: number;
	mesAnterior: string;
	personasVsAnteriorPct: number | null;
	totalMunicipios: number;
	municipiosAlcanzados: number;
	municipiosVsTotalPct: number | null;
	personasEvaluadasAño: number;
	añoActual: number;
	personasEvaluadasAñoAnterior: number;
	añoAnterior: number;
	personasVsAnteiorAñoPct: number | null;
}

export interface TestItem {
	id: number;
	nombre: string;
	unidad_medida: string;
	valor: number;
}

export interface PuntajeAptitud {
	aptitudEvaluada: string;
	puntajePromedio: number;
	Tests: TestItem[];
}

export interface MedianaAptitud {
	aptitudEvaluada: string;
	mediana: number;
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
	ranking: number;
	puntajes: PuntajeAptitud[];
}

export interface DistribucionTestValor {
	idDeportista: number;
	valor: number;
}

export interface DistribucionTest {
	idTest: number;
	nombreTest: string;
	aptitudEvaluada: string;
	unidadMedida: string;
	valores: DistribucionTestValor[];
}

export interface DeportistasEvaluadosResponse {
	deportistas: DeportistaEvaluadoItem[];
	medianas: MedianaAptitud[];
	distribuciones: DistribucionTest[];
}

export interface DeportistasEvaluadosParams {
	idDeporte: number | number[];
	idProvincia: number;
	edadMin: number;
	edadMax: number;
	genero?: "M" | "F";
	idClub?: number;
	idMunicipio?: number;
	nivelEvaluado?: string;
}
