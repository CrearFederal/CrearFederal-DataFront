import { instanceAxios } from "../api/axios";
import { isAxiosError } from "axios";
import { edadesFrecuenciaToAges } from "./dataUtils";
import type { DeportistasGenerosResponse, DeportistasTotalesResponse, EdadesHistogramaResponse } from "../types/Deportistas";

export const getDeportistasTotales = async (signal?: AbortSignal): Promise<DeportistasTotalesResponse> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		const { data } = await instanceAxios.get<DeportistasTotalesResponse>("/deportistas/totales", { signal });
		return data;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener total de deportistas");
		}
		throw new Error("Error al obtener total de deportistas");
	}
};

export const getDeportistasGeneros = async (signal?: AbortSignal): Promise<DeportistasGenerosResponse> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		const { data } = await instanceAxios.get<DeportistasGenerosResponse>("/deportistas/generos", { signal });
		return data;
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || "Error al obtener distribución por género");
		}
		throw new Error("Error al obtener distribución por género");
	}
};

export const getDeportistasEdadesPorGenero = async (genero: "masculino" | "femenino", signal?: AbortSignal): Promise<number[]> => {
	if (!instanceAxios.defaults.baseURL) {
		throw new Error("VITE_API_URL no está configurada");
	}

	try {
		// Map to single letter for backend (M/F)
		const genderParam = genero === "masculino" ? "M" : "F";

		const { data } = await instanceAxios.get<number[] | EdadesHistogramaResponse | { edades: number[] }>(`/deportistas/edades/${genderParam}`, { signal });
		// Handle both raw arrays and histogram payloads.
		if (Array.isArray(data)) {
			return data;
		}

		if ("edadesFrecuencia" in data && Array.isArray(data.edadesFrecuencia)) {
			return edadesFrecuenciaToAges(data.edadesFrecuencia);
		}

		if ("edades" in data && Array.isArray(data.edades)) {
			return data.edades;
		}

		return [];
	} catch (error: unknown) {
		if (isAxiosError<{ message?: string }>(error)) {
			throw new Error(error.response?.data?.message || `Error al obtener edades para género ${genero}`);
		}
		throw new Error(`Error al obtener edades para género ${genero}`);
	}
};