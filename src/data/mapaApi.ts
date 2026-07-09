import { instanceAxios } from "../api/axios";
import type { Filters } from "../types/types";
import type { MapaClub, MapaClubRaw, ProvinciaResumen, ProvinciaResumenRaw, ClubLogosResponse } from "../types/Mapa";

const toNumber = (value: string | number): number => {
  if (typeof value === "number") return value;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toClub = (club: MapaClubRaw): MapaClub => ({
  ...club,
  lat: toNumber(club.lat),
  lng: toNumber(club.lng),
});

const toProvinciaResumen = (item: ProvinciaResumenRaw): ProvinciaResumen => ({
  id_provincia: item.id_provincia,
  nombre: item.nombre,
  totalClubs: item.totalClubes,
  totalAthletes: item.totalDeportistas,
  totalMunicipios: item.totalMunicipios,
  totalNodos: item.totalNodos,
  totalMujeres: item.totalMujeres,
  totalHombres: item.totalHombres,
});

export const getMapaClubes = async (
  filters: Filters,
  signal?: AbortSignal,
  provinciaId?: number,
  municipioId?: number
): Promise<MapaClub[]> => {
  const { data } = await instanceAxios.get<MapaClubRaw[]>("/mapa/clubes", {
    signal,
    params: {
      sports: filters.sports.join(","),
      gender: filters.gender.join(","),
      ageMin: filters.ageRange[0],
      ageMax: filters.ageRange[1],
      ...(provinciaId !== undefined && { provinciaId }),
      ...(municipioId !== undefined && { municipioId }),
    },
  });

  return data.map(toClub);
};

export const getMapaProvinciasResumen = async (
  filters: Filters,
  signal?: AbortSignal
): Promise<ProvinciaResumen[]> => {
  const { data } = await instanceAxios.get<ProvinciaResumenRaw[]>("/mapa/provincias/resumen", {
    signal,
    params: {
      sports: filters.sports.join(","),
      gender: filters.gender.join(","),
      ageMin: filters.ageRange[0],
      ageMax: filters.ageRange[1],
    },
  });

  return data.map(toProvinciaResumen);
};

export const getMapaClubesLogos = async (
  clubIds: number[],
  signal?: AbortSignal
): Promise<Record<number, string | null>> => {
  if (clubIds.length === 0) {
    return {};
  }

  try {
    const { data } = await instanceAxios.get<ClubLogosResponse>("/mapa/clubes/logos", {
      signal,
      params: {
        ids: clubIds.join(","),
      },
    });

    // Convertir array a mapa por id_club para acceso rápido
    const logosMap: Record<number, string | null> = {};
    data.logos.forEach((logo) => {
      logosMap[logo.id_club] = logo.logoUrl;
    });

    return logosMap;
  } catch (error) {
    // En caso de error, retornar un mapa vacío
    console.error("Error fetching logos:", error);
    return {};
  }
};