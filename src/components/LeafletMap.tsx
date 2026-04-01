import { useMemo, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import type { NavigationState, Filters, Club } from "../types/types";
import type { UserRoleConfig } from "../data/roles";
import { canClickProvince } from "../data/roles";
import {
  getProvinciaStats,
  getClubes,
} from "../data/dataUtils";

import {
  argentinaProvinces,
} from "../data/argentinaGeoJson";

import MarkerClusterGroup from "./MarkerClusterGroup";
import MapViewController from "./MapViewController";

// ---------------- TYPES ----------------

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

// ---------------- COMPONENT ----------------

function LeafletMap({
  filters,
  navigation,
  roleConfig,
  clubForRole,
  onProvinceClick,
  onClubClick,
  onNavigateCountry,
}: LeafletMapProps) {
  // -------- DATA --------

  const provStats = useMemo(
    () => getProvinciaStats(filters),
    [filters]
  );

  const maxClubs = useMemo(
    () => Math.max(...provStats.map((p) => p.totalClubs), 1),
    [provStats]
  );

  const clubs = useMemo(() => {
    if (roleConfig.role === "club" && clubForRole) {
      return [clubForRole];
    }

    return getClubes({
      provinciaId: navigation.provinciaId,
      municipioId: navigation.municipioId,
    });
  }, [
    navigation.provinciaId,
    navigation.municipioId,
    roleConfig.role,
    clubForRole,
  ]);

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

  // -------- FLAGS --------

  const isClubRole = roleConfig.role === "club";
  const showProvinces =
    !isClubRole && navigation.level === "country";
  const showClubMarkers =
    isClubRole || navigation.level !== "country";

  const provinceClickable = canClickProvince(roleConfig);

  // -------- STYLES --------

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

      if (isSelected) {
        return {
          fillColor: "hsl(215, 70%, 50%)",
          fillOpacity: 0.2,
          color: "hsl(215, 70%, 50%)",
          weight: 2.5,
        };
      }

      return {
        fillColor: `hsl(215, 30%, ${
          90 - intensity * 25
        }%)`,
        fillOpacity: 0.35 + intensity * 0.3,
        color: "white",
        weight: 0.8,
      };
    },
    [provStats, maxClubs, navigation.provinciaId]
  );

  // -------- EVENTS --------

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
         Atletas: ${stat?.totalAthletes || 0}`,
        { sticky: true }
      );

      (layer as L.Path).on({
        click: () => {
          if (provinceClickable) {
            onProvinceClick(props.id_provincia);
          }
        },
        mouseover: () => {
          const path = layer as L.Path;
          path.bringToFront();
          path.setStyle({
            color: "hsl(215, 70%, 50%)",
            weight: 2,
            fillColor: "hsl(215, 70%, 50%)",
            fillOpacity: 0.28,
          });
        },
        mouseout: () => {
          (layer as any).setStyle(getProvinceStyle(feature));
        },
      });
    },
    [provStats, onProvinceClick, provinceClickable, getProvinceStyle]
  );

  // -------- GEOJSON KEY --------

  const geoJsonKey = useMemo(
    () =>
      `prov-${navigation.provinciaId}-${provStats
        .map((p) => p.totalClubs)
        .join(",")}`,
    [navigation.provinciaId, provStats]
  );

  // -------- TITLE --------

  const mapTitle = useMemo(() => {
    if (isClubRole) {
      return `Club: ${clubForRole?.nombre || ""}`;
    }

    switch (navigation.level) {
      case "country":
        return "Argentina — Clubes por Provincia";
      case "province":
        return "Vista Provincia — Clubes";
      case "city":
        return "Vista Ciudad — Clubes";
      default:
        return "";
    }
  }, [navigation.level, isClubRole, clubForRole]);

  // -------- RENDER --------

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">
          {mapTitle}
        </h3>

        {showClubMarkers && (
          <span className="text-xs text-muted-foreground">
            {clubs.length} clubes
          </span>
        )}
      </div>

      {/* MAP */}
      <MapContainer
        center={[-38.5, -63.5]}
        zoom={1}
        minZoom={1}
        maxZoom={18}
        maxBounds={[[-56, -83], [-21, -52]]}
        className="h-full w-full"
        style={{ minHeight: "65vh" }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

        {showProvinces && (
          <GeoJSON
            key={geoJsonKey}
            data={argentinaProvinces}
            style={getProvinceStyle}
            onEachFeature={handleProvince}
          />
        )}

        {showClubMarkers && (
          <MarkerClusterGroup
            markers={clubMarkers}
            onMarkerClick={onClubClick}
          />
        )}

        <MapViewController
          navigation={navigation}
          roleConfig={roleConfig}
          clubForRole={clubForRole}
          onNavigateCountry={onNavigateCountry}
        />
      </MapContainer>
    </div>
  );
}

export default LeafletMap;