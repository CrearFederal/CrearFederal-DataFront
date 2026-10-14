import { isAxiosError } from "axios";

import { instanceAxios } from "../api/axios";
import type {
	DeportistasEvaluadosParams,
	DeportistasEvaluadosResponse,
	DeportistasBiotipoParams,
	DeportistasBiotipoResponse,
	EvaluacionesDistribucionGeneroResponse,
	EvaluacionesEvolucionMensualResponse,
	EvaluacionesPorNivelResponse,
	EvaluacionesMunicipiosTop10Response,
	EvaluacionesProvinciasTop10Response,
	EvaluacionesResumenResponse,
} from "../types/Evaluaciones";

export const getEvaluacionesResumen = async (
	signal?: AbortSignal
): Promise<EvaluacionesResumenResponse> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		const { data } = await instanceAxios.get<EvaluacionesResumenResponse>("/evaluaciones/resumen", {
			signal,
		});

		return data;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener el resumen de evaluaciones");
		}

		throw new Error("Error al obtener el resumen de evaluaciones");
	}
};

export const getEvaluacionesMunicipiosTop10 = async (
	provinciaId?: number,
	signal?: AbortSignal
): Promise<EvaluacionesMunicipiosTop10Response> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		const { data } = await instanceAxios.get<EvaluacionesMunicipiosTop10Response>(
			"/stats/municipios/top10-evaluaciones",
			{
				params: provinciaId ? { provinciaId } : undefined,
				signal,
			}
		);

		return data;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener el ranking de municipios por evaluaciones");
		}

		throw new Error("Error al obtener el ranking de municipios por evaluaciones");
	}
};

export const getEvaluacionesProvinciasTop10 = async (
	signal?: AbortSignal
): Promise<EvaluacionesProvinciasTop10Response> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		const { data } = await instanceAxios.get<EvaluacionesProvinciasTop10Response>(
			"/stats/provincias/top10-personas-evaluadas",
			{ signal }
		);

		return data;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener el top 10 de provincias por cantidad de personas evaluadas");
		}

		throw new Error("Error al obtener el top 10 de provincias por cantidad de personas evaluadas");
	}
};

export const getEvaluacionesEvolucionMensual = async (
	signal?: AbortSignal
): Promise<EvaluacionesEvolucionMensualResponse> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		const { data } = await instanceAxios.get<EvaluacionesEvolucionMensualResponse>(
			"/stats/evaluaciones/evolucion-mensual",
			{ signal }
		);

		return data;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener la evolución mensual de evaluaciones");
		}

		throw new Error("Error al obtener la evolución mensual de evaluaciones");
	}
};

export const getEvaluacionesPorNivel = async (
	signal?: AbortSignal
): Promise<EvaluacionesPorNivelResponse> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		const { data } = await instanceAxios.get<EvaluacionesPorNivelResponse>("/stats/evaluaciones/por-nivel", {
			signal,
		});

		return data;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener las evaluaciones por nivel");
		}

		throw new Error("Error al obtener las evaluaciones por nivel");
	}
};

export const getEvaluacionesDistribucionGenero = async (
	signal?: AbortSignal
): Promise<EvaluacionesDistribucionGeneroResponse> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		const { data } = await instanceAxios.get<EvaluacionesDistribucionGeneroResponse>(
			"/stats/evaluaciones/distribucion-genero",
			{ signal }
		);

		return data;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener la distribución por género de evaluaciones");
		}

		throw new Error("Error al obtener la distribución por género de evaluaciones");
	}
};

export const getDeportistasEvaluados = async (
	params: DeportistasEvaluadosParams,
	signal?: AbortSignal
): Promise<DeportistasEvaluadosResponse> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		// Backend expects multiple sports as a single comma-joined value (idDeporte=5,8,12).
		const { data } = await instanceAxios.get<DeportistasEvaluadosResponse>(
			"/evaluaciones/deportistas-evaluados",
			{
				params: {
					...params,
					idDeporte: Array.isArray(params.idDeporte) ? params.idDeporte.join(",") : params.idDeporte,
				},
				signal,
			}
		);

		return data;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener los deportistas evaluados");
		}

		throw new Error("Error al obtener los deportistas evaluados");
	}
};

export const getDeportistasBiotipo = async (
	params: DeportistasBiotipoParams,
	signal?: AbortSignal
): Promise<DeportistasBiotipoResponse> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		const { data } = await instanceAxios.get<DeportistasBiotipoResponse>(
			"/evaluaciones/deportistas-biotipo",
			{
				params: {
					...params,
					idDeporte: Array.isArray(params.idDeporte) ? params.idDeporte.join(",") : params.idDeporte,
				},
				signal,
			}
		);

		return data;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener los deportistas (biotipo)");
		}

		throw new Error("Error al obtener los deportistas (biotipo)");
	}
};
