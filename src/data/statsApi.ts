import { isAxiosError } from "axios";

import { instanceAxios } from "../api/axios";
import type { EdadesHistogramaResponse } from "../types/Deportistas";
import type {
	EvaluacionesMunicipiosResponse,
	EvaluacionesMunicipiosTop10Response,
	EvaluacionesResumenResponse,
} from "../types/Evaluaciones";

export interface TopDeporteItem {
	sport: string;
	male: number;
	female: number;
}

export const getTopDeportes = async (signal?: AbortSignal): Promise<TopDeporteItem[]> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		const { data } = await instanceAxios.get<TopDeporteItem[]>("/stats/deportes/top5", { signal });
		return data;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener top deportes");
		}

		throw new Error("Error al obtener top deportes");
	}
};

export const getEdadesHistograma = async (signal?: AbortSignal): Promise<EdadesHistogramaResponse> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		const { data } = await instanceAxios.get<EdadesHistogramaResponse>("/deportistas/edades", { signal });
		return data;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener histograma de edades");
		}

		throw new Error("Error al obtener histograma de edades");
	}
};

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
	signal?: AbortSignal
): Promise<EvaluacionesMunicipiosTop10Response> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		const { data } = await instanceAxios.get<EvaluacionesMunicipiosTop10Response>(
			"/stats/municipios/top10-evaluaciones",
			{ signal }
		);

		return data;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener el top 10 de municipios por evaluaciones");
		}

		throw new Error("Error al obtener el top 10 de municipios por evaluaciones");
	}
};

export const getEvaluacionesMunicipios = async (
	signal?: AbortSignal
): Promise<EvaluacionesMunicipiosResponse> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		const { data } = await instanceAxios.get<EvaluacionesMunicipiosResponse>("/evaluaciones/municipios", {
			signal,
		});

		return data;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener municipios de evaluaciones");
		}

		throw new Error("Error al obtener municipios de evaluaciones");
	}
};
