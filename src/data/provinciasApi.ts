import { instanceAxios } from "../api/axios";
import type { ProvinciasTop10ContextoResponse } from "../types/Provincias";

export const getProvinciasTop10 = async (signal?: AbortSignal): Promise<ProvinciasTop10ContextoResponse> => {
  const response = await instanceAxios.get<ProvinciasTop10ContextoResponse>("/stats/provincias/top10-contexto", {
    signal,
  });
  return response.data;
};
