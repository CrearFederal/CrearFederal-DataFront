import { instanceAxios } from "../api/axios";
import type { PolideportivoDetalleResponse, PolideportivoPorInfraestructura } from "../types/Mapa";

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

export const getPolideportivoDetalle = async (
  id: number,
  signal?: AbortSignal
): Promise<PolideportivoDetalleResponse> => {
  const { data } = await instanceAxios.get<PolideportivoDetalleResponse>(
    `/polideportivos/${id}/detalle`,
    { signal }
  );
  return data;
};

export const getPolideportivosPorInfraestructura = async (
  idsTipoInfra: number[],
  signal?: AbortSignal
): Promise<PolideportivoPorInfraestructura[]> => {
  if (idsTipoInfra.length === 0) {
    return [];
  }

  const { data } = await instanceAxios.get<PolideportivoPorInfraestructura[]>(
    `/polideportivos/infraestructura/${idsTipoInfra.join(",")}`,
    { signal }
  );

  return data.map((p) => ({
    ...p,
    lat: p.lat !== null ? normalizeCoord(toNumber(p.lat), 90) : null,
    lng: p.lng !== null ? normalizeCoord(toNumber(p.lng), 180) : null,
  }));
};
