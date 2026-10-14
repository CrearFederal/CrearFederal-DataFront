import { memo, useMemo, useCallback, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import BaseMapLayers from "./BaseMapLayers";
import L from "leaflet";
import { Globe, Maximize2, Minimize2, Layers2 } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { NavigationState, Filters, Club } from "../types/types";
import type { UserRoleConfig } from "../data/roles";
import { canClickProvince } from "../data/roles";
import {
  getMapaClubes,
  getMapaProvinciasResumen,
  getMapaPolideportivos,
  getMapaPolideportivosLogos,
  getMapaConveniosDeUso,
  getMapaGimnasiosUrbanos,
  getMapaFederaciones,
  getMapaFederacionesLogos,
} from "../data/mapaApi";
import type { Polideportivo, Federacion } from "../types/Mapa";
import { argentinaProvinces } from "../data/argentinaGeoJson";
import { escapeHtml } from "../lib/utils";
import MarkerClusterGroup from "./ClusterGroup";
import PolideportivoClusterGroup from "./PolideportivoClusterGroup";
import MapViewController from "./MapViewController";

// ------- Reajusta el tamaño interno de Leaflet cuando el contenedor cambia de tamaño
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

// ------- Layer selector

const LAYER_OPTIONS = [
  { value: "clubes",         label: "Clubes",           color: "#3b82f6" },
  { value: "polideportivos", label: "Polideportivos",   color: "#f97316" },
  { value: "convenios",      label: "Convenios De Uso", color: "#8b5cf6" },
  { value: "gimnasios",      label: "Gimnasios Urbanos",color: "#16a34a" },
  { value: "federaciones",   label: "Federaciones",     color: "#0d9488" },
] as const;

function LayerSelector({
  selected,
  onChange,
  showInfraLayers = true,
}: {
  selected: string[];
  onChange: (layers: string[]) => void;
  showInfraLayers?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const options = showInfraLayers
    ? LAYER_OPTIONS
    : LAYER_OPTIONS.filter((o) => o.value === "clubes");

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const selectedOptions = selected
    .map((v) => options.find((o) => o.value === v))
    .filter(Boolean) as (typeof LAYER_OPTIONS)[number][];

  const dropdown = open ? (
    <div
      ref={dropdownRef}
      role="listbox"
      aria-multiselectable="true"
      style={{
        position: "fixed",
        top: dropdownPos.top,
        right: dropdownPos.right,
        zIndex: 99999,
      }}
      className="min-w-[190px] rounded-md border border-border bg-card shadow-lg py-1"
    >
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => toggle(opt.value)}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-left hover:bg-muted transition-colors"
          >
            <span
              className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors"
              style={
                isSelected
                  ? { background: opt.color, borderColor: opt.color }
                  : { borderColor: "hsl(var(--border))" }
              }
            >
              {isSelected && (
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden="true">
                  <path
                    d="M1 3L3 5L7 1"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span style={{ color: opt.color }} aria-hidden="true">●</span>
            <span className="text-foreground">{opt.label}</span>
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {selectedOptions.length === 0 ? (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Layers2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              Capas
            </span>
          ) : (
            selectedOptions.map((opt) => (
              <span key={opt.value} className="flex items-center gap-0.5 text-foreground">
                <span style={{ color: opt.color }} aria-hidden="true">●</span>
                <span>{opt.label}</span>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Quitar ${opt.label}`}
                  onClick={(e) => { e.stopPropagation(); toggle(opt.value); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      toggle(opt.value);
                    }
                  }}
                  className="ml-0.5 cursor-pointer opacity-50 hover:opacity-100 transition-opacity"
                >
                  ×
                </span>
              </span>
            ))
          )}
        </div>
        <span className="text-muted-foreground shrink-0 ml-0.5">▾</span>
      </button>

      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
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
  onConvenioClick?: (id: number) => void;
  onGimnasioClick?: (id: number) => void;
  onFederacionClick?: (id: number) => void;
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
  onConvenioClick,
  onGimnasioClick,
  onFederacionClick,
  onNavigateCountry,
}: LeafletMapProps) {
  const [provStats, setProvStats] = useState<
    Array<{ id_provincia: number; totalClubs: number; totalAthletes: number; totalFederaciones: number; polideportivos: Record<string, number> }>
  >([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedLayers, setSelectedLayers] = useState<string[]>(["clubes"]);
  const [polideportivos, setPolideportivos] = useState<Polideportivo[]>([]);
  const [convenios, setConvenios] = useState<Polideportivo[]>([]);
  const [gimnasios, setGimnasios] = useState<Polideportivo[]>([]);
  const [federaciones, setFederaciones] = useState<Federacion[]>([]);
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

  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

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

  const handleConvenioMarkerClick = useCallback(
    (id: number) => {
      setIsFullscreen(false);
      onConvenioClick?.(id);
    },
    [onConvenioClick]
  );

  const handleGimnasioMarkerClick = useCallback(
    (id: number) => {
      setIsFullscreen(false);
      onGimnasioClick?.(id);
    },
    [onGimnasioClick]
  );

  const handleFederacionMarkerClick = useCallback(
    (id: number) => {
      setIsFullscreen(false);
      onFederacionClick?.(id);
    },
    [onFederacionClick]
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

  // Fetch province summary only when filters change
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
        if (!isAbortError(error)) setProvStats([]);
      }
    };

    void loadProvinceSummary();
    return () => controller.abort();
  }, [filters]);

  // Fetch clubs scoped to the current navigation level
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
        if (!isAbortError(error)) setClubs([]);
      }
    };

    void loadClubs();
    return () => controller.abort();
  }, [filters, navigation.provinciaId, navigation.municipioId, roleConfig.role, roleConfig.clubId]);

  // Reset al volver a vista país o cambiar de provincia
  useEffect(() => {
    if (navigation.level === "country") {
      setSelectedLayers(["clubes"]);
      setPolideportivos([]);
      setConvenios([]);
      setGimnasios([]);
      setFederaciones([]);
    }
  }, [navigation.level, navigation.provinciaId]);

  // Lazy-load polideportivos when the layer is activated
  useEffect(() => {
    if (!selectedLayers.includes("polideportivos") || polideportivos.length > 0) return;

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
  }, [selectedLayers, polideportivos.length]);

  // Lazy-load convenios when the layer is activated
  useEffect(() => {
    if (!selectedLayers.includes("convenios") || convenios.length > 0) return;

    const controller = new AbortController();

    const load = async () => {
      try {
        const data = await getMapaConveniosDeUso(controller.signal);
        if (!controller.signal.aborted) setConvenios(data);
      } catch (error) {
        if (!isAbortError(error)) setConvenios([]);
      }
    };

    void load();
    return () => controller.abort();
  }, [selectedLayers, convenios.length]);

  // Lazy-load gimnasios when the layer is activated
  useEffect(() => {
    if (!selectedLayers.includes("gimnasios") || gimnasios.length > 0) return;

    const controller = new AbortController();

    const load = async () => {
      try {
        const data = await getMapaGimnasiosUrbanos(controller.signal);
        if (!controller.signal.aborted) setGimnasios(data);
      } catch (error) {
        if (!isAbortError(error)) setGimnasios([]);
      }
    };

    void load();
    return () => controller.abort();
  }, [selectedLayers, gimnasios.length]);

  // Lazy-load federaciones when the layer is activated
  useEffect(() => {
    if (!selectedLayers.includes("federaciones") || federaciones.length > 0) return;

    const controller = new AbortController();

    const loadFederaciones = async () => {
      try {
        const data = await getMapaFederaciones(controller.signal);
        if (controller.signal.aborted) return;

        const logos = await getMapaFederacionesLogos(
          data.map((f) => f.id),
          controller.signal
        );
        if (controller.signal.aborted) return;

        const enriched = data.map((f) => ({
          ...f,
          logoUrl: logos[f.id] !== undefined ? logos[f.id] : f.logoUrl,
        }));
        setFederaciones(enriched);
      } catch (error) {
        if (!isAbortError(error)) setFederaciones([]);
      }
    };

    void loadFederaciones();
    return () => controller.abort();
  }, [selectedLayers, federaciones.length]);

  // -------- Data

  // Client-side province filter for polideportivos (backend returns all)
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
  const showProvinces = !isClubRole && navigation.level === "country";
  const canShowClubs = isClubRole || navigation.level !== "country";
  const showClubMarkers = canShowClubs && selectedLayers.includes("clubes");

  const provinceClickable = canClickProvince(roleConfig);

  // -------- Styles
  const getProvinceStyle = useCallback(
    (feature: any) => {
      if (!feature?.properties) return {};

      const provId = feature.properties.id_provincia;
      const stat = provStats.find((p) => p.id_provincia === provId);
      const intensity = stat ? stat.totalClubs / maxClubs : 0;
      const isSelected = navigation.provinciaId === provId;
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
        fillOpacity: dimmed ? 0.15 : 0.35 + intensity * 0.3,
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

      const stat = provStats.find((p) => p.id_provincia === props.id_provincia);
      const polideportivosHtml =
        stat && Object.keys(stat.polideportivos).length > 0
          ? Object.entries(stat.polideportivos)
              .map(([tipo, cantidad]) => `${escapeHtml(tipo)}: ${escapeHtml(cantidad)}`)
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
          if (provinceClickable) onProvinceClick(props.id_provincia);
        },
      });
    },
    [provStats, onProvinceClick, getProvinceStyle, provinceClickable]
  );

  // -------- Titulo de mapa según nivel de navegación
  const mapTitle = useMemo(() => {
    if (isClubRole) return `Club: ${clubForRole?.nombre || ""}`;
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
            <LayerSelector
              selected={selectedLayers}
              onChange={setSelectedLayers}
              showInfraLayers={!isClubRole}
            />
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
        <BaseMapLayers />

        {/* Provincias */}
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
          navigation.level !== "country" &&
          (() => {
            const selectedProvince = {
              type: "FeatureCollection" as const,
              features: argentinaProvinces.features.filter(
                (f) => f.properties.id_provincia === navigation.provinciaId
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
        {selectedLayers.includes("polideportivos") && (
          <PolideportivoClusterGroup
            polideportivos={polideportivosFiltrados}
            color="#f97316"
            colorDark="#c2410c"
            onPolideportivoClick={handlePolideportivoMarkerClick}
          />
        )}

        {/* Marcadores convenios de uso */}
        {selectedLayers.includes("convenios") && (
          <PolideportivoClusterGroup
            polideportivos={convenios}
            color="#8b5cf6"
            colorDark="#6d28d9"
            onPolideportivoClick={handleConvenioMarkerClick}
          />
        )}

        {/* Marcadores gimnasios urbanos */}
        {selectedLayers.includes("gimnasios") && (
          <PolideportivoClusterGroup
            polideportivos={gimnasios}
            color="#16a34a"
            colorDark="#15803d"
            onPolideportivoClick={handleGimnasioMarkerClick}
          />
        )}

        {/* Marcadores federaciones */}
        {selectedLayers.includes("federaciones") && (
          <PolideportivoClusterGroup
            polideportivos={federaciones}
            color="#0d9488"
            colorDark="#0f766e"
            onPolideportivoClick={handleFederacionMarkerClick}
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
