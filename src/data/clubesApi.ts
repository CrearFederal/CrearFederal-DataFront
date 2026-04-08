import type { ClubesTotalesResponse } from "../types/Clubes";
import { instanceAxios } from "../api/axios";
import { isAxiosError } from "axios";

export const getClubesTotales = async (signal?: AbortSignal): Promise<ClubesTotalesResponse> => {
    if (!instanceAxios.defaults.baseURL) {
        throw new Error("VITE_API_URL no está configurada");
    }

    try {
        const { data } = await instanceAxios.get<ClubesTotalesResponse>("/clubes/totales", { signal });
        return data;
    } catch (error: unknown) {
        if (isAxiosError<{ message?: string }>(error)) {
            throw new Error(error.response?.data?.message || "Error al obtener total de clubes");
    }
        throw new Error("Error al obtener total de clubes");
    }
};