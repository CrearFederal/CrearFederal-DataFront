import { instanceAxios } from "../api/axios";
import type { FederacionDetalleResponse } from "../types/Mapa";

export const getFederacionDetalle = async (
  id: number,
  signal?: AbortSignal
): Promise<FederacionDetalleResponse> => {
  const { data } = await instanceAxios.get<FederacionDetalleResponse>(
    `/federaciones/${id}/detalle`,
    { signal }
  );
  return data;
};
