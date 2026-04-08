import { instanceAxios } from "../api/axios";
import { isAxiosError } from "axios";
import type { DeportistasTotalesResponse } from "../types/Deportistas";

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