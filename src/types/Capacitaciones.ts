// Contrato de datos de la sección Capacitaciones.
// Hoy lo sirve el mock (src/data/capacitacionesMockData.ts); cuando la DB
// tenga carga, los endpoints reales deben devolver exactamente estas formas.

/** Una capacitación dictada. */
export interface Capacitacion {
	id: number;
	nombre: string;
	categoria: string;
	/** Nombre de la subcategoría, o null si el origen sólo trae el id del catálogo. */
	subcategoria: string | null;
	idSubcategoria: number | null;
	/** Sólo para capacitaciones de Técnicas Deportivas Específicas. */
	deporte: string | null;
	idDeporte: number | null;
	tipoOrganizador: string | null;
	organizador: string | null;
	provincia: string | null;
	nodo: string | null;
	municipio: string | null;
	modalidad: string;
	/** ISO YYYY-MM-DD. */
	fechaInicio: string | null;
	fechaFin: string | null;
	duracionHoras: number;
	totalAsistentes: number;
}

/** Una asistencia: una persona en una capacitación. */
export interface AsistenteCapacitacion {
	idCapacitacion: number;
	dni: string;
	nombre: string;
	apellido: string;
	genero: string;
	fechaNacimiento: string | null;
	tipoAsistente: string;
	idProvincia: number | null;
	idMunicipio: number | null;
}

/** GET /api/capacitaciones/resumen */
export interface CapacitacionesResumen {
	totalCapacitaciones: number;
	/** Suma de asistencias (una persona cuenta una vez por capacitación). */
	totalAsistencias: number;
	/** Personas distintas alcanzadas (DNI único). */
	personasUnicas: number;
	horasDictadas: number;
	promedioAsistentes: number;
	organizadoresActivos: number;
}

export interface ConteoItem {
	nombre: string;
	cantidad: number;
}

export interface CapacitacionesPorMesItem {
	/** ISO YYYY-MM. */
	mes: string;
	etiqueta: string;
	capacitaciones: number;
	asistencias: number;
}

/** GET /api/capacitaciones/distribuciones */
export interface CapacitacionesDistribuciones {
	porCategoria: ConteoItem[];
	porModalidad: ConteoItem[];
	porTipoOrganizador: ConteoItem[];
	porMes: CapacitacionesPorMesItem[];
	porGenero: ConteoItem[];
	porTipoAsistente: ConteoItem[];
	porRangoEtario: ConteoItem[];
}

/** Filtros que la sección aplica; viajan como query params al endpoint real. */
export interface CapacitacionesFiltros {
	categoria?: string | null;
	modalidad?: string | null;
	tipoOrganizador?: string | null;
	/** Búsqueda por nombre de evento u organizador. */
	busqueda?: string | null;
}

/** Valores disponibles para poblar los selectores de filtro. */
export interface CapacitacionesOpcionesFiltro {
	categorias: string[];
	modalidades: string[];
	tiposOrganizador: string[];
}
