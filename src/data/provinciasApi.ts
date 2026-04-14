import { instanceAxios } from "../api/axios";
import type { ProvinciasTop10Response } from "../types/Provincias";

export const getProvinciasTop10 = async (signal?: AbortSignal): Promise<ProvinciasTop10Response> => {
  const response = await instanceAxios.get<ProvinciasTop10Response>("/stats/provincias/top10", {
    signal,
  });
  return response.data;
};
