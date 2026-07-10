import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { Building2, MapPin } from "lucide-react";

import { authBootstrap, getAuthMe, sendLogoutOnPageClose } from "../api/session";
import { getTiposInfraestructura, getClubesPorInfraestructura } from "../data/clubesApi";
import type { AuthScope } from "../types/auth";
import type { TipoInfraestructura, ClubPorInfraestructura } from "../types/Clubes";
import type { UserRoleConfig } from "../data/roles";
import SearchableMultiSelect from "../components/SearchableMultiSelect";
import MarkerClusterGroup from "../components/ClusterGroup";
import ClubDetailPanel from "../components/ClubDetailPanel";

const mapScopeToRoleConfig = (scope: AuthScope): UserRoleConfig => {
    switch (scope.role) {
            case "coa":
                    return { role: "coa" };
            case "province":
                    return {
                            role: "province",
                            provinciaId: scope.provinciaId ?? undefined,
                    };
            case "municipality":
                    return {
                            role: "municipality",
                            provinciaId: scope.provinciaId ?? undefined,
                            municipioId: scope.municipioId ?? undefined,
                    };
            case "club":
                    return {
                            role: "club",
                            clubId: scope.clubId ?? undefined,
                    };
            case "federation":
                    return {
                            role: "federation",
                            federationScope: scope.federationScope ?? undefined,
                            provinciaId: scope.provinciaId ?? undefined,
                            deporteId: scope.deporteId ?? undefined,
                    };
            default:
                    return { role: "coa" };
    }
};

const isAbortError = (error: unknown): boolean => {
    if (error instanceof DOMException && error.name === "AbortError") {
            return true;
    }

    if (typeof error === "object" && error !== null) {
            const err = error as { name?: string; code?: string };
            return err.name === "CanceledError" || err.code === "ERR_CANCELED";
    }

    return false;
};

function Infraestructura() {
    const [roleConfig, setRoleConfig] = useState<UserRoleConfig | null>(null);
    const [authStatus, setAuthStatus] = useState<"loading" | "ready" | "error">("loading");

    const [tiposInfra, setTiposInfra] = useState<TipoInfraestructura[]>([]);
    const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
    const [clubes, setClubes] = useState<ClubPorInfraestructura[]>([]);
    const [isLoadingClubes, setIsLoadingClubes] = useState(false);
    const [selectedClubId, setSelectedClubId] = useState<number | null>(null);

    // -------- Auth bootstrap (mismo patrón que Evaluaciones.tsx)
    useEffect(() => {
            const controller = new AbortController();
            let active = true;

            const cleanupLoginParam = () => {
                    const url = new URL(window.location.href);
                    if (!url.searchParams.has("login")) return;

                    url.searchParams.delete("login");
                    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
                    window.history.replaceState({}, document.title, nextUrl || "/");
            };

            const initializeAuth = async () => {
                    const login = new URLSearchParams(window.location.search).get("login")?.trim();

                    if (login) {
                            try {
                                    const boot = await authBootstrap(login, controller.signal);
                                    if (!active) return;

                                    setRoleConfig(mapScopeToRoleConfig(boot.scope));
                                    cleanupLoginParam();
                                    setAuthStatus("ready");
                                    return;
                            } catch (error) {
                                    if (!active || isAbortError(error)) return;
                                    setAuthStatus("error");
                                    return;
                            }
                    }

                    try {
                            const me = await getAuthMe(controller.signal);
                            if (!active) return;

                            setRoleConfig(mapScopeToRoleConfig(me.scope));
                            cleanupLoginParam();
                            setAuthStatus("ready");
                    } catch (error) {
                            if (!active || isAbortError(error)) return;
                            setAuthStatus("error");
                    }
            };

            void initializeAuth();

            return () => {
                    active = false;
                    controller.abort();
            };
    }, []);

    useEffect(() => {
            if (authStatus !== "ready") return;

            const handlePageHide = () => {
                    sendLogoutOnPageClose();
            };

            window.addEventListener("pagehide", handlePageHide);

            return () => {
                    window.removeEventListener("pagehide", handlePageHide);
            };
    }, [authStatus]);

    // -------- Catálogo de tipos de infraestructura (una sola vez)
    useEffect(() => {
            if (authStatus !== "ready") return;

            const controller = new AbortController();

            const loadTipos = async () => {
                    try {
                            const data = await getTiposInfraestructura(controller.signal);
                            if (!controller.signal.aborted) {
                                    setTiposInfra(data);
                            }
                    } catch (error) {
                            if (!isAbortError(error)) {
                                    setTiposInfra([]);
                            }
                    }
            };

            void loadTipos();

            return () => controller.abort();
    }, [authStatus]);

    // -------- Clubes filtrados por infraestructura seleccionada
    useEffect(() => {
            if (authStatus !== "ready") return;

            const controller = new AbortController();
            const idsTipoInfra = selectedTipos.map((id) => Number(id));

            if (idsTipoInfra.length === 0) {
                    setClubes([]);
                    setIsLoadingClubes(false);
                    return;
            }

            setIsLoadingClubes(true);

            const loadClubes = async () => {
                    try {
                            const data = await getClubesPorInfraestructura(idsTipoInfra, controller.signal);
                            if (!controller.signal.aborted) {
                                    setClubes(data);
                                    setIsLoadingClubes(false);
                            }
                    } catch (error) {
                            if (!isAbortError(error)) {
                                    setClubes([]);
                                    setIsLoadingClubes(false);
                            }
                    }
            };

            void loadClubes();

            return () => controller.abort();
    }, [authStatus, selectedTipos]);

    const tipoOptions = useMemo(
            () =>
                    tiposInfra.map((tipo) => ({
                            value: String(tipo.id_tipo_infra),
                            label: tipo.descripcion,
                            description: tipo.categoria,
                    })),
            [tiposInfra]
    );

    const clubesConCoordenadas = useMemo(
            () => clubes.filter((c) => c.lat !== null && c.lng !== null),
            [clubes]
    );

    const mapMarkers = useMemo(
            () =>
                    clubesConCoordenadas.map((c) => ({
                            lat: c.lat as number,
                            lng: c.lng as number,
                            id: c.id_club,
                            name: c.nombre,
                            address: c.direccion,
                            logoUrl: c.logoUrl ?? undefined,
                    })),
            [clubesConCoordenadas]
    );

    const handleMarkerClick = useCallback((clubId: number) => {
            setSelectedClubId(clubId);
    }, []);

    if (authStatus === "loading") {
            return (
                    <div className="min-h-screen bg-background flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">Inicializando sesión...</p>
                    </div>
            );
    }

    if (authStatus === "error" || !roleConfig) {
            return (
                    <div className="min-h-screen bg-background flex items-center justify-center">
                            <p className="text-sm text-destructive">No se pudo inicializar la sesión.</p>
                    </div>
            );
    }

    return (
            <div className="h-screen overflow-hidden bg-background flex flex-col">
                    <div className="flex-1 flex flex-col p-4 gap-4 min-h-0">
                            <div>
                                    <h1 className="text-lg font-semibold text-foreground">Infraestructura</h1>
                                    <p className="text-sm text-muted-foreground">
                                            Seleccioná una o más infraestructuras para ver los clubes que las poseen.
                                    </p>
                            </div>

                            <div className="max-w-md">
                                    <SearchableMultiSelect
                                            id="infraestructura-select"
                                            label="Tipos de infraestructura"
                                            placeholder="Seleccionar infraestructuras..."
                                            searchPlaceholder="Buscar infraestructura..."
                                            options={tipoOptions}
                                            values={selectedTipos}
                                            onChange={setSelectedTipos}
                                            emptyMessage="No hay tipos de infraestructura disponibles."
                                    />
                            </div>

                            {selectedTipos.length === 0 ? (
                                    <div className="flex flex-1 items-center justify-center rounded-xl border border-border bg-card min-h-0">
                                            <p className="text-sm text-muted-foreground">
                                                    Seleccioná al menos una infraestructura para ver resultados.
                                            </p>
                                    </div>
                            ) : (
                                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 flex-1 min-h-0">
                                            {/* Mapa */}
                                            <div className="isolate rounded-xl border border-border bg-card overflow-hidden flex flex-col h-[420px] xl:h-auto min-h-0">
                                                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                                                    <MapPin className="h-4 w-4 text-primary" />
                                                                    <span>Mapa de clubes</span>
                                                            </h3>
                                                            <span className="text-xs text-muted-foreground">
                                                                    {mapMarkers.length} con ubicación
                                                            </span>
                                                    </div>
                                                    <MapContainer
                                                            center={[-38.5, -63.5]}
                                                            zoom={4}
                                                            minZoom={4}
                                                            maxZoom={18}
                                                            maxBounds={[[-56, -76], [-20, -52]]}
                                                            attributionControl={false}
                                                            className="w-full flex-1 min-h-0"
                                                            style={{ height: "100%" }}
                                                    >
                                                            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                                            <MarkerClusterGroup markers={mapMarkers} onMarkerClick={handleMarkerClick} />
                                                    </MapContainer>
                                            </div>

                                            {/* Tabla */}
                                            <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col h-[420px] xl:h-auto min-h-0">
                                                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                                                    <Building2 className="h-4 w-4 text-primary" />
                                                                    <span>Clubes con esta infraestructura</span>
                                                            </h3>
                                                            <span className="text-xs text-muted-foreground">{clubes.length} clubes</span>
                                                    </div>
                                                    <div className="flex-1 overflow-auto min-h-0">
                                                            {isLoadingClubes ? (
                                                                    <div className="flex h-full items-center justify-center">
                                                                            <p className="text-sm text-muted-foreground">Cargando clubes...</p>
                                                                    </div>
                                                            ) : clubes.length === 0 ? (
                                                                    <div className="flex h-full items-center justify-center">
                                                                            <p className="text-sm text-muted-foreground">
                                                                                    No se encontraron clubes con esa combinación.
                                                                            </p>
                                                                    </div>
                                                            ) : (
                                                                     <table className="w-full text-sm">
                                                                              <thead className="sticky top-0 bg-card">
                                                                                      <tr className="border-b border-border text-left text-xs
  text-muted-foreground">
                                                                                              <th className="px-4 py-2 font-medium">Club</th>
                                                                                              <th className="px-4 py-2 font-medium">Provincia</th>
                                                                                              <th className="px-4 py-2 font-medium">Municipio</th>
                                                                                              <th className="px-4 py-2 font-medium">Dirección</th>
                                                                                      </tr>
                                                                              </thead>
                                                                              <tbody>
                                                                                      {clubes.map((club) => (
                                                                                              <tr
                                                                                                      key={club.id_club}
                                                                                                      onClick={() => setSelectedClubId(club.id_club)}
                                                                                                      className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"                                                                                              >
                                                                                                      <td className="px-4 py-2 font-medium text-foreground">{club.nombre}</td>
                                                                                                      <td className="px-4 py-2 text-muted-foreground">{club.nombreProvincia}</td>
                                                                                                      <td className="px-4 py-2 text-muted-foreground">{club.nombreMunicipio || "—"}</td>
                                                                                                      <td className="px-4 py-2 text-muted-foreground">{club.direccion || "—"}</td>
                                                                                              </tr>
                                                                                      ))}
                                                                              </tbody>
                                                                      </table>
                                                            )}
                                                    </div>
                                            </div>
                                    </div>
                            )}
                    </div>

                    {selectedClubId !== null && (
                            <ClubDetailPanel clubId={selectedClubId} onClose={() => setSelectedClubId(null)} />
                    )}
            </div>
    );
}

export default Infraestructura;