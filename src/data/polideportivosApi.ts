import { instanceAxios } from "../api/axios";
import type { PolideportivoDetalleResponse } from "../types/Mapa";

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
