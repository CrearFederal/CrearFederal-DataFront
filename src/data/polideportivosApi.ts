import { instanceAxios } from "../api/axios";
import type { PolideportivoDetalleResponse, PolideportivoPorInfraestructura } from "../types/Mapa";
import { toNumber, normalizeCoordOrNull } from "./coords";

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
    lat: p.lat !== null ? normalizeCoordOrNull(toNumber(p.lat), 90) : null,
    lng: p.lng !== null ? normalizeCoordOrNull(toNumber(p.lng), 180) : null,
  }));
};
