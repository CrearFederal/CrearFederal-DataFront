import { instanceAxios } from "../api/axios";                                                                                                                
import { isAxiosError } from "axios";
import type { EdadesHistogramaResponse } from "../types/Deportistas";       

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