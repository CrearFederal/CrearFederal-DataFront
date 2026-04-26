import { instanceAxios } from "../api/axios";
import type { MunicipiosTop10ContextoResponse } from "../types/Municipios";

export const getMunicipiosTop10 = async (signal?: AbortSignal): Promise<MunicipiosTop10ContextoResponse> => {
	const response = await instanceAxios.get<MunicipiosTop10ContextoResponse>("/stats/municipios/top10-contexto", {
		signal,
	});
	return response.data;
};
