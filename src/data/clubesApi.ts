import type { ClubesTotalesResponse } from "../types/Clubes";
import type { TopClubApiItem, TopClubApiResponse, TopClubRankingItem } from "../types/Clubes";
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

const normalizeTopClubesResponse = (
    data: TopClubApiResponse | TopClubApiItem[]
): TopClubRankingItem[] => {
    const clubes = Array.isArray(data) ? data : data.clubes ?? [];

    return clubes.map((item) => ({
        id_club: 0,
        nombre: item.nombreCorto,
        nombre_corto: item.nombreCorto,
        nombreProvincia: item.nombreProvincia,
        nombreMunicipio: item.nombreMunicipio,
        totalDeportistas: item.cantidadDeportista,
    }));
};

export const getTopClubes = async (signal?: AbortSignal): Promise<TopClubRankingItem[]> => {
    if (!instanceAxios.defaults.baseURL) {
        throw new Error("VITE_API_URL no está configurada");
    }

    try {
        const { data } = await instanceAxios.get<TopClubApiResponse | TopClubApiItem[]>("/clubes/top10", { signal });
        return normalizeTopClubesResponse(data);
    } catch (error: unknown) {
        if (isAxiosError<{ message?: string }>(error)) {
            throw new Error(error.response?.data?.message || "Error al obtener top clubes");
        }
        throw new Error("Error al obtener top clubes");
    }
};