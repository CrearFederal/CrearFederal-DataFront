import { useMemo, useCallback, useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import L from "leaflet";
import { Globe } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { NavigationState, Filters, Club } from "../types/types";
import type { UserRoleConfig } from "../data/roles";
import { canClickProvince } from "../data/roles";
import { getMapaClubes, getMapaProvinciasResumen } from "../data/mapaApi";
import { argentinaProvinces } from "../data/argentinaGeoJson";
import MarkerClusterGroup from "./ClusterGroup";
import MapViewController from "./MapViewController";

// --------- Type
interface LeafletMapProps {
  filters: Filters;
  navigation: NavigationState;
  roleConfig: UserRoleConfig;
  clubForRole?: Club | null;
  onProvinceClick: (provinciaId: number) => void;
  onMunicipioClick: (munId: number) => void;
  onClubClick: (clubId: number) => void;
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
  onNavigateCountry,
}: LeafletMapProps) {
  const [provStats, setProvStats] = useState<
    Array<{ id_provincia: number; totalClubs: number; totalAthletes: number }>
  >([]);
  const [clubs, setClubs] = useState<Club[]>([]);

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

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      try {
        const [provinceSummary, clubesRaw] = await Promise.all([
          getMapaProvinciasResumen(filters, controller.signal),
          getMapaClubes(filters, controller.signal),
        ]);

        if (controller.signal.aborted) return;

        const scopedClubs = clubesRaw
          .filter((club) => (navigation.provinciaId ? club.id_provincia === navigation.provinciaId : true))
          .filter((club) => (navigation.municipioId ? club.id_municipio === navigation.municipioId : true))
          // Evita marcadores en 0,0 o coordenadas inválidas.
          .filter((club) => club.lat !== 0 && club.lng !== 0)
          .map((club) => ({
            ...club,
            lat: Number(club.lat),
            lng: Number(club.lng),
          }));

        setProvStats(
          provinceSummary.map((item) => ({
            id_provincia: item.id_provincia,
            totalClubs: item.totalClubs,
            totalAthletes: item.totalAthletes,
          }))
        );

        if (roleConfig.role === "club" && roleConfig.clubId) {
          setClubs(scopedClubs.filter((club) => club.id_club === roleConfig.clubId));
          return;
        }

        setClubs(scopedClubs);
      } catch (error) {
        if (!isAbortError(error)) {
          setProvStats([]);
          setClubs([]);
        }
      }
    };

    void loadData();

    return () => controller.abort();
  }, [filters, navigation.provinciaId, navigation.municipioId, roleConfig.role, roleConfig.clubId]);

  // -------- Data

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
        logoUrl: c.logoUrl,
      })),
    [clubs]
  );

  // -------- Flags por rol y nivel de navegación
  const isClubRole = roleConfig.role === "club";
  const showProvinces =
    !isClubRole && navigation.level === "country";
  const showClubMarkers =
    isClubRole || navigation.level !== "country";

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

      layer.bindTooltip(
        `<strong style="color: hsl(215, 70%, 50%)">${props.nombre}</strong><br/>
         Clubes: ${stat?.totalClubs || 0}<br/>
         Deportistas: ${stat?.totalAthletes || 0}`,
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
    <div className="rounded-xl border border-border bg-card overflow-hidden h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <span>{mapTitle}</span>
        </h3>

        {showClubMarkers && (
          <span className="text-xs text-muted-foreground">
            {clubs.length} clubes
          </span>
        )}
      </div>

      {/* Mapa */}
      <MapContainer
        center={[-38.5, -63.5]}
        zoom={6}
        minZoom={4}
        maxZoom={18}
        maxBounds={[[-56, -76], [-20, -52]]}
        attributionControl={false}
        className="w-full flex-1 min-h-0"
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

        {/* Marcadores */}
        {showClubMarkers && (
          <MarkerClusterGroup
            markers={clubMarkers}
            onMarkerClick={onClubClick}
          />
        )}

        <MapViewController
          navigation={navigation}
          roleConfig={roleConfig}
          clubs={clubs}
          clubForRole={clubForRole}
          onNavigateCountry={onNavigateCountry}
        />
      </MapContainer>
    </div>
  );
}

export default LeafletMap;