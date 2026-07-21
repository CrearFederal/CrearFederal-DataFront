import { memo, useMemo, useCallback, useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import { Globe, Maximize2, Minimize2, Building2, LandPlot } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { NavigationState, Filters, Club } from "../types/types";
import type { UserRoleConfig } from "../data/roles";
import { canClickProvince } from "../data/roles";
import { getMapaClubes, getMapaProvinciasResumen, getMapaPolideportivos, getMapaPolideportivosLogos } from "../data/mapaApi";
import type { Polideportivo } from "../types/Mapa";
import { argentinaProvinces } from "../data/argentinaGeoJson";
import MarkerClusterGroup from "./ClusterGroup";
import PolideportivoClusterGroup from "./PolideportivoClusterGroup";
import MapViewController from "./MapViewController";

// ------- Reajusta el tamaño interno de Leaflet cuando el contenedor cambia de tamaño
// (p. ej. al alternar pantalla completa), ya que Leaflet no lo detecta solo.
function MapAutoResize() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

// --------- Type
interface LeafletMapProps {
  filters: Filters;
  navigation: NavigationState;
  roleConfig: UserRoleConfig;
  clubForRole?: Club | null;
  onProvinceClick: (provinciaId: number) => void;
  onMunicipioClick: (munId: number) => void;
  onClubClick: (clubId: number) => void;
  onPolideportivoClick?: (id: number) => void;
  onNavigateCountry?: () => void;
}

// ------- Componente de mapa con Leaflet
function LeafletMap({
  filters,
  navigation,
  roleConfig,
  clubForRole,
  onProvinceClick,
  onClubClick,
  onPolideportivoClick,
  onNavigateCountry,
}: LeafletMapProps) {
  const [provStats, setProvStats] = useState<
    Array<{ id_provincia: number; totalClubs: number; totalAthletes: number; totalFederaciones: number; polideportivos: Record<string, number> }>
  >([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [showClubLayer, setShowClubLayer] = useState(true);
  const [polideportivos, setPolideportivos] = useState<Polideportivo[]>([]);
  const [showPolideportivos, setShowPolideportivos] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerDivRef = useRef<HTMLDivElement>(null);
  const initialZoom = typeof window !== "undefined" && window.innerWidth < 768 ? 4 : 6;

  useEffect(() => {
    const el = containerDivRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => e.preventDefault();
    el.addEventListener("touchmove", prevent, { passive: false });
    return () => el.removeEventListener("touchmove", prevent);
  }, []);

  // Permite salir de pantalla completa con Escape
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // El panel de detalle del club se renderiza fuera del mapa (z-index menor al
  // del overlay de pantalla completa), así que hay que salir de pantalla completa
  // antes de abrirlo o quedaría oculto detrás del mapa.
  const handleClubMarkerClick = useCallback(
    (clubId: number) => {
      setIsFullscreen(false);
      onClubClick(clubId);
    },
    [onClubClick]
  );

  const handlePolideportivoMarkerClick = useCallback(
    (id: number) => {
      setIsFullscreen(false);
      onPolideportivoClick?.(id);
    },
    [onPolideportivoClick]
  );

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

  // Fetch province summary only when filters change — not on navigation drill-down
  useEffect(() => {
    const controller = new AbortController();

    const loadProvinceSummary = async () => {
      try {
        const provinceSummary = await getMapaProvinciasResumen(filters, controller.signal);

        if (controller.signal.aborted) return;

        setProvStats(
          provinceSummary.map((item) => ({
            id_provincia: item.id_provincia,
            totalClubs: item.totalClubs,
            totalAthletes: item.totalAthletes,
            totalFederaciones: item.totalFederaciones,
            polideportivos: item.polideportivos,
          }))
        );
      } catch (error) {
        if (!isAbortError(error)) {
          setProvStats([]);
        }
      }
    };

    void loadProvinceSummary();

    return () => controller.abort();
  }, [filters]);

  // Fetch clubs scoped to the current navigation level — re-runs on province/municipio changes
  useEffect(() => {
    const controller = new AbortController();

    const loadClubs = async () => {
      try {
        const clubesRaw = await getMapaClubes(
          filters,
          controller.signal,
          navigation.provinciaId,
          navigation.municipioId
        );

        if (controller.signal.aborted) return;

        const scopedClubs = clubesRaw
          .filter((club) => club.lat !== 0 && club.lng !== 0)
          .map((club) => ({
            ...club,
            lat: Number(club.lat),
            lng: Number(club.lng),
          }));

        if (roleConfig.role === "club" && roleConfig.clubId) {
          setClubs(scopedClubs.filter((club) => club.id_club === roleConfig.clubId));
        } else {
          setClubs(scopedClubs);
        }

      } catch (error) {
        if (!isAbortError(error)) {
          setClubs([]);
        }
      }
    };

    void loadClubs();

    return () => controller.abort();
  }, [filters, navigation.provinciaId, navigation.municipioId, roleConfig.role, roleConfig.clubId]);

  // Reset al volver a vista país o cambiar de provincia
  useEffect(() => {
    if (navigation.level === "country") {
      setShowPolideportivos(false);
      setPolideportivos([]);
    }
    setShowClubLayer(true);
  }, [navigation.level, navigation.provinciaId]);

  // Fetch todos los polideportivos una sola vez (el backend no filtra por provincia)
  useEffect(() => {
    if (!showPolideportivos || polideportivos.length > 0) return;

    const controller = new AbortController();

    const loadPolideportivos = async () => {
      try {
        const data = await getMapaPolideportivos(controller.signal);
        if (controller.signal.aborted) return;

        const logos = await getMapaPolideportivosLogos(
          data.map((p) => p.id),
          controller.signal
        );
        if (controller.signal.aborted) return;

        const enriched = data.map((p) => ({
          ...p,
          logoUrl: logos[p.id] !== undefined ? logos[p.id] : p.logoUrl,
        }));
        setPolideportivos(enriched);
      } catch (error) {
        if (!isAbortError(error)) setPolideportivos([]);
      }
    };

    void loadPolideportivos();

    return () => controller.abort();
  }, [showPolideportivos, polideportivos.length]);

  // -------- Data

  // Filtra client-side por provincia activa (el backend devuelve todos)
  const polideportivosFiltrados = useMemo(
    () =>
      navigation.provinciaId
        ? polideportivos.filter((p) => p.id_provincia === navigation.provinciaId)
        : polideportivos,
    [polideportivos, navigation.provinciaId]
  );

  const maxClubs = useMemo(
    () => Math.max(...provStats.map((p) => p.totalClubs), 1),
    [provStats]
  );

  const clubMarkers = useMemo(
    () =>
      clubs.map((c) => ({
        lat: c.lat,
        lng: c.lng,
        id: c.id_club,
        name: c.nombre,
        address: c.direccion,
        logoUrl: `${import.meta.env.VITE_API_URL}/mapa/clubes/${c.id_club}/logo`,
      })),
    [clubs]
  );

  // -------- Flags por rol y nivel de navegación
  const isClubRole = roleConfig.role === "club";
  const showProvinces =
    !isClubRole && navigation.level === "country";
  const canShowClubs =
    isClubRole || navigation.level !== "country";
  const showClubMarkers = canShowClubs && showClubLayer;

  const provinceClickable = canClickProvince(roleConfig);

  // -------- Styles
  const getProvinceStyle = useCallback(
    (feature: any) => {
      if (!feature?.properties) return {};

      const provId = feature.properties.id_provincia;
      const stat = provStats.find(
        (p) => p.id_provincia === provId
      );

      const intensity = stat
        ? stat.totalClubs / maxClubs
        : 0;

      const isSelected =
        navigation.provinciaId === provId;

      const dimmed = !!navigation.provinciaId;

      if (isSelected) {
        return {
          fillColor: "hsl(215, 70%, 50%)",
          fillOpacity: 0.55,
          color: "hsl(215, 75%, 55%)",
          weight: 2.5,
          opacity: 1,
        };
      }

      return {
        fillColor: `hsl(215, 30%, ${90 - intensity * 25}%)`,
        fillOpacity: dimmed
          ? 0.15
          : 0.35 + intensity * 0.3,
        color: "rgba(255,255,255,0.7)",
        weight: 1,
        opacity: dimmed ? 0.4 : 0.8,
      };
    },
    [provStats, maxClubs, navigation.provinciaId]
  );

  // -------- Eventos para cada provincia tooltip + hover + click
  const handleProvince = useCallback(
    (feature: any, layer: L.Layer) => {
      const props = feature.properties;
      if (!props) return;

      const stat = provStats.find(
        (p) => p.id_provincia === props.id_provincia
      );

      const polideportivosHtml = stat && Object.keys(stat.polideportivos).length > 0
        ? Object.entries(stat.polideportivos)
            .map(([tipo, cantidad]) => `${tipo}: ${cantidad}`)
            .join("<br/>")
        : null;

      layer.bindTooltip(
        `<strong style="color: hsl(215, 70%, 50%)">${props.nombre}</strong><br/>
         Clubes: ${stat?.totalClubs || 0}<br/>
         Deportistas: ${stat?.totalAthletes || 0}<br/>
         Federaciones: ${stat?.totalFederaciones || 0}${polideportivosHtml ? `<br/><span style="color: hsl(215, 20%, 55%); font-size: 11px;">─────</span><br/>${polideportivosHtml}` : ""}`,
        { sticky: true }
      );

      (layer as L.Path).on({
        mouseover: (e) => {
          if (!provinceClickable) return;

          const target = e.target as L.Path;
          target.setStyle({
            fillColor: "hsl(215, 50%, 65%)",
            fillOpacity: 0.5,
            weight: 3,
            color: "hsl(215, 70%, 50%)",
          });
          target.bringToFront();
        },

        mouseout: (e) => {
          const target = e.target as L.Path;
          target.setStyle(getProvinceStyle(feature));
        },

        click: () => {
          if (provinceClickable) {
            onProvinceClick(props.id_provincia);
          }
        },
      });
    },
    [provStats, onProvinceClick, getProvinceStyle, provinceClickable]
  );

  // -------- Titulo de mapa según nivel de navegación
  const mapTitle = useMemo(() => {
    if (isClubRole) {
      return `Club: ${clubForRole?.nombre || ""}`;
    }

    switch (navigation.level) {
      case "country":
        return "Argentina — Clubes y Deportistas por Provincia";
      case "province":
        return "Vista Provincia — Clubes";
      case "city":
        return "Vista Ciudad — Clubes";
      default:
        return "";
    }
  }, [navigation.level, isClubRole, clubForRole]);

  return (
    <div
      ref={containerDivRef}
      className={
        isFullscreen
          ? "fixed inset-0 z-[1000] rounded-none border-0 bg-card flex flex-col min-h-0"
          // `isolate` keeps Leaflet's own internal z-index (its zoom control sits at
          // z-index: 1000) contained here, so it can't leak above other overlays
          // elsewhere on the page (e.g. the club detail panel's backdrop).
          : "isolate rounded-xl border border-border bg-card overflow-hidden h-full flex flex-col min-h-0"
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <span>{mapTitle}</span>
        </h3>

        <div className="flex items-center gap-2">
          {canShowClubs && (
            <button
              type="button"
              onClick={() => setShowClubLayer((prev) => !prev)}
              aria-label={showClubLayer ? "Ocultar clubes" : "Mostrar clubes"}
              title={showClubLayer ? "Ocultar clubes" : "Mostrar clubes"}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                showClubLayer
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              {showClubLayer && clubs.length > 0 && (
                <span className="font-bold">{clubs.length}</span>
              )}
              Clubes
            </button>
          )}
          {canShowClubs && !isClubRole && (
            <button
              type="button"
              onClick={() => setShowPolideportivos((prev) => !prev)}
              aria-label={showPolideportivos ? "Ocultar polideportivos" : "Mostrar polideportivos"}
              title={showPolideportivos ? "Ocultar polideportivos" : "Mostrar polideportivos"}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                showPolideportivos
                  ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <LandPlot className="h-3.5 w-3.5" />
              {showPolideportivos && polideportivosFiltrados.length > 0 && (
                <span className="font-bold">{polideportivosFiltrados.length}</span>
              )}
              Polideportivos
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            aria-label={isFullscreen ? "Salir de pantalla completa" : "Ver mapa en pantalla completa"}
            title={isFullscreen ? "Salir de pantalla completa" : "Ver mapa en pantalla completa"}
            className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mapa */}
      <MapContainer
        center={[-38.5, -63.5]}
        zoom={initialZoom}
        minZoom={4}
        maxZoom={18}
        maxBounds={[[-56, -76], [-20, -52]]}
        attributionControl={false}
        className="w-full flex-1 min-h-0 touch-none"
        style={{ height: "100%" }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

        {/* Provincias*/}
        {showProvinces && (
          <GeoJSON
            key={`provinces-${provStats.length}`}
            data={argentinaProvinces}
            style={getProvinceStyle}
            onEachFeature={handleProvince}
          />
        )}

        {/* Provincia Seleccionada */}
        {navigation.provinciaId &&
          navigation.level !== "country" && (() => {
            const selectedProvince = {
              type: "FeatureCollection" as const,
              features: argentinaProvinces.features.filter(
                (f) =>
                  f.properties.id_provincia ===
                  navigation.provinciaId
              ),
            };

            return (
              <GeoJSON
                key={`selected-${navigation.provinciaId}`}
                data={selectedProvince as any}
                style={{
                  fillColor: "hsl(215, 70%, 50%)",
                  fillOpacity: 0.08,
                  color: "hsl(215, 70%, 50%)",
                  weight: 3,
                  dashArray: "6, 4",
                }}
              />
            );
          })()}

        {/* Marcadores clubes */}
        {showClubMarkers && (
          <MarkerClusterGroup
            markers={clubMarkers}
            onMarkerClick={handleClubMarkerClick}
          />
        )}

        {/* Marcadores polideportivos */}
        {showPolideportivos && polideportivosFiltrados.length > 0 && (
          <PolideportivoClusterGroup
            polideportivos={polideportivosFiltrados}
            onPolideportivoClick={handlePolideportivoMarkerClick}
          />
        )}

        <MapViewController
          navigation={navigation}
          roleConfig={roleConfig}
          clubs={clubs}
          clubForRole={clubForRole}
          onNavigateCountry={onNavigateCountry}
        />
        <MapAutoResize />
      </MapContainer>
    </div>
  );
}

export default memo(LeafletMap);