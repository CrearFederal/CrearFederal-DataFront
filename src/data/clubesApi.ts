import type { ClubesTotalesResponse, ClubDetalleResponse, TopClubesDetalleResponse, TipoInfraestructura, ClubPorInfraestructura } from "../types/Clubes";
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
        id_club: item.id_club,
        nombre: item.nombreCorto,
        nombre_corto: item.nombreCorto,
        nombreProvincia: item.nombreProvincia,
        nombreMunicipio: item.nombreMunicipio,
        totalDeportistas: item.cantidadDeportista,
    }));
};

export const getClubDetalle = async (id: number, signal?: AbortSignal): Promise<ClubDetalleResponse> => {
    if (!instanceAxios.defaults.baseURL) {
        throw new Error("VITE_API_URL no está configurada");
    }

    try {
        const { data } = await instanceAxios.get<ClubDetalleResponse>(`/clubes/${id}/detalle`, { signal });
        return data;
    } catch (error: unknown) {
        if (isAxiosError<{ message?: string }>(error)) {
            throw new Error(error.response?.data?.message || "Error al obtener el detalle del club");
        }
        throw new Error("Error al obtener el detalle del club");
    }
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

export const getTopClubesDetalle = async (signal?: AbortSignal): Promise<TopClubesDetalleResponse> => {
    if (!instanceAxios.defaults.baseURL) {
        throw new Error("VITE_API_URL no está configurada");
    }

    try {
        const { data } = await instanceAxios.get<TopClubesDetalleResponse>("/clubes/top10/detalles", { signal });
        return data;
    } catch (error: unknown) {
        if (isAxiosError<{ message?: string }>(error)) {
            throw new Error(error.response?.data?.message || "Error al obtener top clubes detallado");
        }
        throw new Error("Error al obtener top clubes detallado");
    }
};

export const getTiposInfraestructura = async (signal?: AbortSignal): Promise<TipoInfraestructura[]> => {
    if (!instanceAxios.defaults.baseURL) {
        throw new Error("VITE_API_URL no está configurada");
    }

    try {
        const { data } = await instanceAxios.get<TipoInfraestructura[]>("/clubes/infraestructura/tipos", { signal });
        return data;
    } catch (error: unknown) {
        if (isAxiosError<{ message?: string }>(error)) {
            throw new Error(error.response?.data?.message || "Error al obtener tipos de infraestructura");
        }
        throw new Error("Error al obtener tipos de infraestructura");
    }
}
export const getClubesPorInfraestructura = async (
    idsTipoInfra: number[],
    signal?: AbortSignal
): Promise<ClubPorInfraestructura[]> => {
    if (idsTipoInfra.length === 0) {
        return [];
    }

    if (!instanceAxios.defaults.baseURL) {
        throw new Error("VITE_API_URL no está configurada");
    }

    try {
        const { data } = await instanceAxios.get<ClubPorInfraestructura[]>(
            `/clubes/infraestructura/${idsTipoInfra.join(",")}`,
            { signal }
        );
        return data;
    } catch (error: unknown) {
        if (isAxiosError<{ message?: string }>(error)) {
            throw new Error(error.response?.data?.message || "Error al obtener clubes por infraestructura");
        }
        throw new Error("Error al obtener clubes por infraestructura");
    }
};