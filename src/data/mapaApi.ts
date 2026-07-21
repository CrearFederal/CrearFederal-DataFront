import { instanceAxios } from "../api/axios";
import type { Filters } from "../types/types";
import type { MapaClub, MapaClubRaw, ProvinciaResumen, ProvinciaResumenRaw, ClubLogosResponse, Polideportivo, PolideportivoRaw, PolideportivoLogosResponse } from "../types/Mapa";

const toNumber = (value: string | number): number => {
  if (typeof value === "number") return value;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// Coordenadas pueden venir como enteros escalados (×10^N). Divide por 10
// iterativamente hasta quedar dentro del rango válido (±90 lat, ±180 lng).
const normalizeCoord = (value: number, max: number): number => {
  let v = value;
  while (Math.abs(v) > max) v /= 10;
  return v;
};

const toClub = (club: MapaClubRaw): MapaClub => ({
  ...club,
  lat: normalizeCoord(toNumber(club.lat), 90),
  lng: normalizeCoord(toNumber(club.lng), 180),
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
  totalFederaciones: item.totalFederaciones ?? 0,
  polideportivos: item.polideportivos ?? {},
});

const toPolideportivo = (raw: PolideportivoRaw): Polideportivo => ({
  ...raw,
  lat: normalizeCoord(toNumber(raw.lat), 90),
  lng: normalizeCoord(toNumber(raw.lng), 180),
});

export const getMapaPolideportivos = async (
  signal?: AbortSignal,
  provinciaId?: number,
  municipioId?: number
): Promise<Polideportivo[]> => {
  const { data } = await instanceAxios.get<PolideportivoRaw[]>("/mapa/polideportivos", {
    signal,
    params: {
      ...(provinciaId !== undefined && { provinciaId }),
      ...(municipioId !== undefined && { municipioId }),
    },
  });
  return data.map(toPolideportivo);
};

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

export const getMapaPolideportivosLogos = async (
  polideportivoIds: number[],
  signal?: AbortSignal
): Promise<Record<number, string | null>> => {
  if (polideportivoIds.length === 0) return {};

  try {
    const { data } = await instanceAxios.get<PolideportivoLogosResponse>("/mapa/polideportivos/logos", {
      signal,
      params: { ids: polideportivoIds.join(",") },
    });

    const logosMap: Record<number, string | null> = {};
    data.logos.forEach((logo) => {
      logosMap[logo.id] = logo.logoUrl;
    });
    return logosMap;
  } catch (error) {
    console.error("Error fetching polideportivos logos:", error);
    return {};
  }
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