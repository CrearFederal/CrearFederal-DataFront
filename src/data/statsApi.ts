import { isAxiosError } from "axios";

import { instanceAxios } from "../api/axios";
import type { EdadesHistogramaResponse } from "../types/Deportistas";

export interface TopDeporteItem {
	sport: string;
	male: number;
	female: number;
}

export interface DeporteItem {
	id_deporte: number;
	nombre: string;
	totalDeportistas: number;
	totalHombres: number;
	totalMujeres: number;
}

export interface DeporteProvinciaItem {
	id_provincia: number;
	nombre: string;
	totalDeportistas: number;
	totalClubes: number;
	totalMujeres: number;
	totalHombres: number;
	porcentaje: number;
}

export interface DeporteProvinciasResponse {
	deporte: { id: number; nombre: string };
	totalDeportistas: number;
	totalProvincias: number;
	provincias: DeporteProvinciaItem[];
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

export const getTopDeportesTop10 = async (signal?: AbortSignal): Promise<TopDeporteItem[]> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		const { data } = await instanceAxios.get<TopDeporteItem[]>("/stats/deportes/top10", { signal });
		return data;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener top 10 deportes");
		}

		throw new Error("Error al obtener top 10 deportes");
	}
};

export const getDeportesAll = async (signal?: AbortSignal): Promise<DeporteItem[]> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		const { data } = await instanceAxios.get<{ deportes: DeporteItem[] }>("/stats/deportes", { signal });
		return data.deportes;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener deportes");
		}

		throw new Error("Error al obtener deportes");
	}
};

export const getDeporteProvincias = async (id: number, signal?: AbortSignal): Promise<DeporteProvinciasResponse> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		const { data } = await instanceAxios.get<DeporteProvinciasResponse>(`/stats/deportes/${id}/provincias`, { signal });
		return data;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener cobertura provincial del deporte");
		}

		throw new Error("Error al obtener cobertura provincial del deporte");
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

export interface ProvinciaScopeItem {
	id_provincia: number;
	nombre: string;
}

export interface DeporteScopeItem {
	id_deporte: number;
	nombre: string;
}

export interface MunicipioClubScopeItem {
	id: number;
	nombre: string;
}

export interface MunicipiosClubesPorScopeResponse {
	municipios: MunicipioClubScopeItem[];
	clubes: MunicipioClubScopeItem[];
}

export const getProvinciasPorScope = async (signal?: AbortSignal): Promise<ProvinciaScopeItem[]> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		const { data } = await instanceAxios.get<{ provincias: ProvinciaScopeItem[] }>(
			"/stats/provincias/por-scope",
			{ signal }
		);
		return data.provincias;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener provincias");
		}

		throw new Error("Error al obtener provincias");
	}
};

export const getDeportesPorScope = async (signal?: AbortSignal): Promise<DeporteScopeItem[]> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		const { data } = await instanceAxios.get<{ deportes: DeporteScopeItem[] }>(
			"/stats/deportes/por-scope",
			{ signal }
		);
		return data.deportes;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener deportes");
		}

		throw new Error("Error al obtener deportes");
	}
};

export const getMunicipiosClubesPorScope = async (
	idProvincia: number,
	idDeporte: number,
	signal?: AbortSignal
): Promise<MunicipiosClubesPorScopeResponse> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		const { data } = await instanceAxios.get<MunicipiosClubesPorScopeResponse>(
			"/stats/municipios-clubes/por-scope",
			{ params: { idProvincia, idDeporte }, signal }
		);
		return data;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener municipios y clubes");
		}

		throw new Error("Error al obtener municipios y clubes");
	}
};