import { isAxiosError } from "axios";

import { instanceAxios } from "../api/axios";
import { CAPACITACIONES_MOCK, ASISTENTES_MOCK } from "./capacitacionesMockData";
import type {
	AsistenteCapacitacion,
	Capacitacion,
	CapacitacionesDistribuciones,
	CapacitacionesFiltros,
	CapacitacionesOpcionesFiltro,
	CapacitacionesPorMesItem,
	CapacitacionesResumen,
	ConteoItem,
} from "../types/Capacitaciones";

/**
 * Mientras las tablas de capacitaciones estén vacías, la sección se alimenta
 * del dataset simulado. Poner en false cuando existan los endpoints reales:
 * las firmas y las formas de respuesta ya son las definitivas, así que la
 * página no necesita cambios.
 */
export const USE_MOCK_CAPACITACIONES = true;

const MESES = [
	"Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
	"Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const RANGOS_ETARIOS = [
	{ nombre: "Menos de 18", min: 0, max: 17 },
	{ nombre: "18 a 29", min: 18, max: 29 },
	{ nombre: "30 a 44", min: 30, max: 44 },
	{ nombre: "45 a 59", min: 45, max: 59 },
	{ nombre: "60 o más", min: 60, max: 200 },
];

const toParams = (filtros?: CapacitacionesFiltros) => ({
	categoria: filtros?.categoria || undefined,
	modalidad: filtros?.modalidad || undefined,
	tipoOrganizador: filtros?.tipoOrganizador || undefined,
	busqueda: filtros?.busqueda || undefined,
});

const requireBaseUrl = () => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}
};

const throwApiError = (error: unknown, mensaje: string): never => {
	if (isAxiosError<{ message?: string }>(error)) {
		throw new Error(error.response?.data?.message || mensaje);
	}
	throw new Error(mensaje);
};

// ---------------------------------------------------------------- mock helpers

const normalizar = (valor: string) =>
	valor.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

/** Mismo filtrado que deberá hacer el backend con los query params. */
const filtrarMock = (filtros?: CapacitacionesFiltros): Capacitacion[] => {
	const busqueda = filtros?.busqueda ? normalizar(filtros.busqueda.trim()) : null;

	return CAPACITACIONES_MOCK.filter((capacitacion) => {
		if (filtros?.categoria && capacitacion.categoria !== filtros.categoria) return false;
		if (filtros?.modalidad && capacitacion.modalidad !== filtros.modalidad) return false;
		if (filtros?.tipoOrganizador && (capacitacion.tipoOrganizador ?? "") !== filtros.tipoOrganizador) {
			return false;
		}
		if (busqueda) {
			const texto = normalizar(`${capacitacion.nombre} ${capacitacion.organizador ?? ""}`);
			if (!texto.includes(busqueda)) return false;
		}
		return true;
	});
};

const asistentesDe = (capacitaciones: Capacitacion[]): AsistenteCapacitacion[] => {
	const ids = new Set(capacitaciones.map((capacitacion) => capacitacion.id));
	return ASISTENTES_MOCK.filter((asistente) => ids.has(asistente.idCapacitacion));
};

const contarPor = <T,>(items: T[], clave: (item: T) => string | null): ConteoItem[] => {
	const conteo = new Map<string, number>();

	for (const item of items) {
		const nombre = clave(item) || "Sin especificar";
		conteo.set(nombre, (conteo.get(nombre) ?? 0) + 1);
	}

	return [...conteo.entries()]
		.map(([nombre, cantidad]) => ({ nombre, cantidad }))
		.sort((a, b) => b.cantidad - a.cantidad);
};

const edadA = (fechaNacimiento: string | null, referencia: string | null): number | null => {
	if (!fechaNacimiento) return null;

	const nacimiento = new Date(`${fechaNacimiento}T00:00:00`);
	const corte = referencia ? new Date(`${referencia}T00:00:00`) : new Date();
	if (Number.isNaN(nacimiento.getTime()) || Number.isNaN(corte.getTime())) return null;

	let edad = corte.getFullYear() - nacimiento.getFullYear();
	const mes = corte.getMonth() - nacimiento.getMonth();
	if (mes < 0 || (mes === 0 && corte.getDate() < nacimiento.getDate())) edad -= 1;

	return edad >= 0 && edad < 120 ? edad : null;
};

const construirPorMes = (
	capacitaciones: Capacitacion[],
	asistentes: AsistenteCapacitacion[]
): CapacitacionesPorMesItem[] => {
	const asistenciasPorCapacitacion = new Map<number, number>();
	for (const asistente of asistentes) {
		asistenciasPorCapacitacion.set(
			asistente.idCapacitacion,
			(asistenciasPorCapacitacion.get(asistente.idCapacitacion) ?? 0) + 1
		);
	}

	const acumulado = new Map<string, { capacitaciones: number; asistencias: number }>();

	for (const capacitacion of capacitaciones) {
		if (!capacitacion.fechaInicio) continue;

		const mes = capacitacion.fechaInicio.slice(0, 7);
		const actual = acumulado.get(mes) ?? { capacitaciones: 0, asistencias: 0 };
		actual.capacitaciones += 1;
		actual.asistencias += asistenciasPorCapacitacion.get(capacitacion.id) ?? 0;
		acumulado.set(mes, actual);
	}

	return [...acumulado.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([mes, valores]) => ({
			mes,
			etiqueta: MESES[Number(mes.slice(5, 7)) - 1] ?? mes,
			capacitaciones: valores.capacitaciones,
			asistencias: valores.asistencias,
		}));
};

// ---------------------------------------------------------------- endpoints

/** GET /api/capacitaciones/resumen */
export const getCapacitacionesResumen = async (
	filtros?: CapacitacionesFiltros,
	signal?: AbortSignal
): Promise<CapacitacionesResumen> => {
	if (USE_MOCK_CAPACITACIONES) {
		const capacitaciones = filtrarMock(filtros);
		const asistentes = asistentesDe(capacitaciones);
		const horasDictadas = capacitaciones.reduce((total, item) => total + item.duracionHoras, 0);
		const organizadores = new Set(
			capacitaciones.map((item) => item.organizador).filter((item): item is string => Boolean(item))
		);

		return {
			totalCapacitaciones: capacitaciones.length,
			totalAsistencias: asistentes.length,
			personasUnicas: new Set(asistentes.map((item) => item.dni)).size,
			horasDictadas,
			promedioAsistentes: capacitaciones.length
				? Math.round((asistentes.length / capacitaciones.length) * 10) / 10
				: 0,
			organizadoresActivos: organizadores.size,
		};
	}

	requireBaseUrl();

	try {
		const { data } = await instanceAxios.get<CapacitacionesResumen>("/capacitaciones/resumen", {
			params: toParams(filtros),
			signal,
		});
		return data;
	} catch (error: unknown) {
		return throwApiError(error, "Error al obtener el resumen de capacitaciones");
	}
};

/** GET /api/capacitaciones/distribuciones */
export const getCapacitacionesDistribuciones = async (
	filtros?: CapacitacionesFiltros,
	signal?: AbortSignal
): Promise<CapacitacionesDistribuciones> => {
	if (USE_MOCK_CAPACITACIONES) {
		const capacitaciones = filtrarMock(filtros);
		const asistentes = asistentesDe(capacitaciones);
		const fechaPorCapacitacion = new Map(
			capacitaciones.map((item) => [item.id, item.fechaInicio] as const)
		);

		return {
			porCategoria: contarPor(capacitaciones, (item) => item.categoria),
			porModalidad: contarPor(capacitaciones, (item) => item.modalidad),
			porTipoOrganizador: contarPor(capacitaciones, (item) => item.tipoOrganizador),
			porMes: construirPorMes(capacitaciones, asistentes),
			porGenero: contarPor(asistentes, (item) => item.genero),
			porTipoAsistente: contarPor(asistentes, (item) => item.tipoAsistente),
			porRangoEtario: RANGOS_ETARIOS.map((rango) => ({
				nombre: rango.nombre,
				cantidad: asistentes.filter((asistente) => {
					const edad = edadA(
						asistente.fechaNacimiento,
						fechaPorCapacitacion.get(asistente.idCapacitacion) ?? null
					);
					return edad !== null && edad >= rango.min && edad <= rango.max;
				}).length,
			})),
		};
	}

	requireBaseUrl();

	try {
		const { data } = await instanceAxios.get<CapacitacionesDistribuciones>(
			"/capacitaciones/distribuciones",
			{ params: toParams(filtros), signal }
		);
		return data;
	} catch (error: unknown) {
		return throwApiError(error, "Error al obtener las distribuciones de capacitaciones");
	}
};

/** GET /api/capacitaciones */
export const getCapacitaciones = async (
	filtros?: CapacitacionesFiltros,
	signal?: AbortSignal
): Promise<Capacitacion[]> => {
	if (USE_MOCK_CAPACITACIONES) {
		return filtrarMock(filtros);
	}

	requireBaseUrl();

	try {
		const { data } = await instanceAxios.get<Capacitacion[]>("/capacitaciones", {
			params: toParams(filtros),
			signal,
		});
		return data;
	} catch (error: unknown) {
		return throwApiError(error, "Error al obtener el listado de capacitaciones");
	}
};

/** GET /api/capacitaciones/filtros */
export const getCapacitacionesOpcionesFiltro = async (
	signal?: AbortSignal
): Promise<CapacitacionesOpcionesFiltro> => {
	if (USE_MOCK_CAPACITACIONES) {
		const unicos = (valores: (string | null)[]) =>
			[...new Set(valores.filter((valor): valor is string => Boolean(valor)))].sort((a, b) =>
				a.localeCompare(b, "es")
			);

		return {
			categorias: unicos(CAPACITACIONES_MOCK.map((item) => item.categoria)),
			modalidades: unicos(CAPACITACIONES_MOCK.map((item) => item.modalidad)),
			tiposOrganizador: unicos(CAPACITACIONES_MOCK.map((item) => item.tipoOrganizador)),
		};
	}

	requireBaseUrl();

	try {
		const { data } = await instanceAxios.get<CapacitacionesOpcionesFiltro>("/capacitaciones/filtros", {
			signal,
		});
		return data;
	} catch (error: unknown) {
		return throwApiError(error, "Error al obtener los filtros de capacitaciones");
	}
};
