import { instanceAxios } from "./axios";
import type { AuthBootstrapResponse, AuthMeResponse } from "../types/auth";

export const authBootstrap = async (
  login: string,
  signal?: AbortSignal
): Promise<AuthBootstrapResponse> => {
  const { data } = await instanceAxios.get<AuthBootstrapResponse>("/auth/bootstrap", {
    params: { login },
    signal,
  });

  return data;
};

export const getAuthMe = async (signal?: AbortSignal): Promise<AuthMeResponse> => {
  const { data } = await instanceAxios.get<AuthMeResponse>("/auth/me", { signal });
  return data;
};

export const sendLogoutOnPageClose = (): void => {
  if (!instanceAxios.defaults.baseURL) return;

  const logoutUrl = new URL("auth/logout", `${instanceAxios.defaults.baseURL.replace(/\/$/, "")}/`).toString();

  void fetch(logoutUrl, {
    method: "POST",
    credentials: "include",
    keepalive: true,
  });
};