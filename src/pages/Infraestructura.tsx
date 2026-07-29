import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { Building2, LandPlot, MapPin, Search } from "lucide-react";

import { authBootstrap, getAuthMe, sendLogoutOnPageClose } from "../api/session";
import { getTiposInfraestructura, getClubesPorInfraestructura } from "../data/clubesApi";
import { getPolideportivosPorInfraestructura } from "../data/polideportivosApi";
import type { AuthScope } from "../types/auth";
import type { TipoInfraestructura, ClubPorInfraestructura } from "../types/Clubes";
import type { PolideportivoPorInfraestructura } from "../types/Mapa";
import type { UserRoleConfig } from "../data/roles";
import SearchableMultiSelect from "../components/SearchableMultiSelect";
import MarkerClusterGroup from "../components/ClusterGroup";
import PolideportivoClusterGroup from "../components/PolideportivoClusterGroup";
import ClubDetailPanel from "../components/ClubDetailPanel";
import PolideportivoDetailPanel from "../components/PolideportivoDetailPanel";

interface ActiveSearch {
    tipos: number[];
    clubes: boolean;
    polideportivos: boolean;
}

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
    const [showClubesToggle, setShowClubesToggle] = useState(false);
    const [showPolideportivosToggle, setShowPolideportivosToggle] = useState(false);
    const [activeSearch, setActiveSearch] = useState<ActiveSearch | null>(null);

    const [clubes, setClubes] = useState<ClubPorInfraestructura[]>([]);
    const [isLoadingClubes, setIsLoadingClubes] = useState(false);
    const [selectedClubId, setSelectedClubId] = useState<number | null>(null);

    const [polideportivos, setPolideportivos] = useState<PolideportivoPorInfraestructura[]>([]);
    const [isLoadingPolideportivos, setIsLoadingPolideportivos] = useState(false);
    const [selectedPolideportivoId, setSelectedPolideportivoId] = useState<number | null>(null);

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

    // Firma + lista de tipos propios de cada búsqueda: mantiene una referencia
    // estable mientras el contenido no cambie, para que "Buscar" no dispare un
    // refetch de una entidad cuando solo cambió el toggle de la otra.
    const clubesSignature = activeSearch?.clubes ? activeSearch.tipos.join(",") : null;
    const clubesTipos = useMemo(
            () => (clubesSignature ? clubesSignature.split(",").map(Number) : []),
            [clubesSignature]
    );
    const polideportivosSignature = activeSearch?.polideportivos ? activeSearch.tipos.join(",") : null;
    const polideportivosTipos = useMemo(
            () => (polideportivosSignature ? polideportivosSignature.split(",").map(Number) : []),
            [polideportivosSignature]
    );

    // -------- Clubes filtrados por infraestructura buscada
    useEffect(() => {
            if (authStatus !== "ready") return;

            if (!activeSearch?.clubes || clubesTipos.length === 0) {
                    setClubes([]);
                    setIsLoadingClubes(false);
                    return;
            }

            const controller = new AbortController();
            setIsLoadingClubes(true);

            const loadClubes = async () => {
                    try {
                            const data = await getClubesPorInfraestructura(clubesTipos, controller.signal);
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
    }, [authStatus, activeSearch?.clubes, clubesTipos]);

    // -------- Polideportivos filtrados por infraestructura buscada
    useEffect(() => {
            if (authStatus !== "ready") return;

            if (!activeSearch?.polideportivos || polideportivosTipos.length === 0) {
                    setPolideportivos([]);
                    setIsLoadingPolideportivos(false);
                    return;
            }

            const controller = new AbortController();
            setIsLoadingPolideportivos(true);

            const loadPolideportivos = async () => {
                    try {
                            const data = await getPolideportivosPorInfraestructura(polideportivosTipos, controller.signal);
                            if (!controller.signal.aborted) {
                                    setPolideportivos(data);
                                    setIsLoadingPolideportivos(false);
                            }
                    } catch (error) {
                            if (!isAbortError(error)) {
                                    setPolideportivos([]);
                                    setIsLoadingPolideportivos(false);
                            }
                    }
            };

            void loadPolideportivos();

            return () => controller.abort();
    }, [authStatus, activeSearch?.polideportivos, polideportivosTipos]);

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

    const clubMapMarkers = useMemo(
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

    const polideportivosConCoordenadas = useMemo(
            () => polideportivos.filter((p) => p.lat !== null && p.lng !== null),
            [polideportivos]
    );

    const polideportivoMapMarkers = useMemo(
            () =>
                    polideportivosConCoordenadas.map((p) => ({
                            id: p.id,
                            nombre: p.nombre,
                            id_provincia: p.id_provincia,
                            id_nodo: 0,
                            id_municipio: p.id_municipio,
                            direccion: p.direccion,
                            lat: p.lat as number,
                            lng: p.lng as number,
                            logoUrl: p.logoUrl,
                    })),
            [polideportivosConCoordenadas]
    );

    const handleClubMarkerClick = useCallback((clubId: number) => {
            setSelectedClubId(clubId);
    }, []);

    const handlePolideportivoMarkerClick = useCallback((id: number) => {
            setSelectedPolideportivoId(id);
    }, []);

    const canSearch = selectedTipos.length > 0 && (showClubesToggle || showPolideportivosToggle);

    const handleBuscar = useCallback(() => {
            if (!canSearch) return;
            setActiveSearch({
                    tipos: selectedTipos.map((id) => Number(id)),
                    clubes: showClubesToggle,
                    polideportivos: showPolideportivosToggle,
            });
    }, [canSearch, selectedTipos, showClubesToggle, showPolideportivosToggle]);

    const totalConUbicacion = clubMapMarkers.length + polideportivoMapMarkers.length;

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
                                            Elegí si buscás clubes, polideportivos o ambos, seleccioná las infraestructuras y tocá Buscar.
                                    </p>
                            </div>

                            <div className="flex flex-wrap items-end gap-3">
                                    <div className="max-w-md flex-1 min-w-[240px]">
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

                                    <div className="flex items-center gap-2">
                                            <button
                                                    type="button"
                                                    onClick={() => setShowClubesToggle((prev) => !prev)}
                                                    aria-pressed={showClubesToggle}
                                                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors border ${
                                                            showClubesToggle
                                                                    ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
                                                                    : "text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                                                    }`}
                                            >
                                                    <Building2 className="h-3.5 w-3.5" />
                                                    Clubes
                                            </button>
                                            <button
                                                    type="button"
                                                    onClick={() => setShowPolideportivosToggle((prev) => !prev)}
                                                    aria-pressed={showPolideportivosToggle}
                                                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs font-medium transition-colors border ${
                                                            showPolideportivosToggle
                                                                    ? "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200"
                                                                    : "text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                                                    }`}
                                            >
                                                    <LandPlot className="h-3.5 w-3.5" />
                                                    Polideportivos
                                            </button>
                                    </div>

                                    <button
                                            type="button"
                                            onClick={handleBuscar}
                                            disabled={!canSearch}
                                            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                            <Search className="h-3.5 w-3.5" />
                                            Buscar
                                    </button>
                            </div>

                            {activeSearch === null ? (
                                    <div className="flex flex-1 items-center justify-center rounded-xl border border-border bg-card min-h-0">
                                            <p className="text-sm text-muted-foreground">
                                                    Seleccioná infraestructuras, elegí clubes y/o polideportivos, y tocá Buscar para ver resultados.
                                            </p>
                                    </div>
                            ) : (
                                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 flex-1 min-h-0">
                                            {/* Mapa */}
                                            <div className="isolate rounded-xl border border-border bg-card overflow-hidden flex flex-col h-[420px] xl:h-auto min-h-0">
                                                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                                                    <MapPin className="h-4 w-4 text-primary" />
                                                                    <span>Mapa</span>
                                                            </h3>
                                                            <span className="text-xs text-muted-foreground">
                                                                    {totalConUbicacion} con ubicación
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
                                                            {activeSearch.clubes && (
                                                                    <MarkerClusterGroup markers={clubMapMarkers} onMarkerClick={handleClubMarkerClick} />
                                                            )}
                                                            {activeSearch.polideportivos && (
                                                                    <PolideportivoClusterGroup
                                                                            polideportivos={polideportivoMapMarkers}
                                                                            onPolideportivoClick={handlePolideportivoMarkerClick}
                                                                            color="#f97316"
                                                                            colorDark="#c2410c"
                                                                    />
                                                            )}
                                                    </MapContainer>
                                            </div>

                                            {/* Tablas */}
                                            <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col h-[420px] xl:h-auto min-h-0">
                                                    <div className="flex-1 overflow-auto min-h-0 divide-y divide-border">
                                                            {activeSearch.clubes && (
                                                                    <div>
                                                                            <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-card border-b border-border">
                                                                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                                                                            <Building2 className="h-4 w-4 text-blue-600" />
                                                                                            <span>Clubes</span>
                                                                                    </h3>
                                                                                    <span className="text-xs text-muted-foreground">{clubes.length} clubes</span>
                                                                            </div>
                                                                            {isLoadingClubes ? (
                                                                                    <p className="px-4 py-4 text-sm text-muted-foreground">Cargando clubes...</p>
                                                                            ) : clubes.length === 0 ? (
                                                                                    <p className="px-4 py-4 text-sm text-muted-foreground">
                                                                                            No se encontraron clubes con esa combinación.
                                                                                    </p>
                                                                            ) : (
                                                                                    <table className="w-full text-sm">
                                                                                            <thead>
                                                                                                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
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
                                                                                                                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                                                                                                            >
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
                                                            )}

                                                            {activeSearch.polideportivos && (
                                                                    <div>
                                                                            <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-card border-b border-border">
                                                                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                                                                            <LandPlot className="h-4 w-4 text-orange-600" />
                                                                                            <span>Polideportivos</span>
                                                                                    </h3>
                                                                                    <span className="text-xs text-muted-foreground">{polideportivos.length} polideportivos</span>
                                                                            </div>
                                                                            {isLoadingPolideportivos ? (
                                                                                    <p className="px-4 py-4 text-sm text-muted-foreground">Cargando polideportivos...</p>
                                                                            ) : polideportivos.length === 0 ? (
                                                                                    <p className="px-4 py-4 text-sm text-muted-foreground">
                                                                                            No se encontraron polideportivos con esa combinación.
                                                                                    </p>
                                                                            ) : (
                                                                                    <table className="w-full text-sm">
                                                                                            <thead>
                                                                                                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                                                                                                            <th className="px-4 py-2 font-medium">Polideportivo</th>
                                                                                                            <th className="px-4 py-2 font-medium">Provincia</th>
                                                                                                            <th className="px-4 py-2 font-medium">Municipio</th>
                                                                                                            <th className="px-4 py-2 font-medium">Dirección</th>
                                                                                                    </tr>
                                                                                            </thead>
                                                                                            <tbody>
                                                                                                    {polideportivos.map((poli) => (
                                                                                                            <tr
                                                                                                                    key={poli.id}
                                                                                                                    onClick={() => setSelectedPolideportivoId(poli.id)}
                                                                                                                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                                                                                                            >
                                                                                                                    <td className="px-4 py-2 font-medium text-foreground">{poli.nombre}</td>
                                                                                                                    <td className="px-4 py-2 text-muted-foreground">{poli.nombreProvincia}</td>
                                                                                                                    <td className="px-4 py-2 text-muted-foreground">{poli.nombreMunicipio || "—"}</td>
                                                                                                                    <td className="px-4 py-2 text-muted-foreground">{poli.direccion || "—"}</td>
                                                                                                            </tr>
                                                                                                    ))}
                                                                                            </tbody>
                                                                                    </table>
                                                                            )}
                                                                    </div>
                                                            )}
                                                    </div>
                                            </div>
                                    </div>
                            )}
                    </div>

                    {selectedClubId !== null && (
                            <ClubDetailPanel clubId={selectedClubId} onClose={() => setSelectedClubId(null)} />
                    )}

                    {selectedPolideportivoId !== null && (
                            <PolideportivoDetailPanel
                                    polideportivoId={selectedPolideportivoId}
                                    onClose={() => setSelectedPolideportivoId(null)}
                            />
                    )}
            </div>
    );
}

export default Infraestructura;
