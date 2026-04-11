export type AuthRole = "coa" | "province" | "municipality" | "club" | "federation";

export type AuthFederationScope = "national" | "provincial" | null;

export interface AuthScope {
  role: AuthRole;
  federationScope: AuthFederationScope;
  canViewAll: boolean;
  provinciaId: number | null;
  nodoId: number | null;
  municipioId: number | null;
  clubId: number | null;
  deporteId: number | null;
}

export interface AuthBootstrapUser {
  login: string;
  group_id: number;
  id_provincia: number | null;
  id_nodo: number | null;
  id_municipio: number | null;
  id_club: number | null;
  id_deporte: number | null;
}

export interface AuthBootstrapResponse {
  ok: boolean;
  user: AuthBootstrapUser;
  scope: AuthScope;
}

export interface AuthMeResponse {
  ok: boolean;
  scope: AuthScope;
}