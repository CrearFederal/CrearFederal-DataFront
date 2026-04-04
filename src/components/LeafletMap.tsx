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
        zoom={5}
        minZoom={4}
        maxZoom={18}
        maxBounds={[[-56, -76], [-20, -52]]}
        attributionControl={false}
        className="h-full w-full"
        style={{ minHeight: "65vh" }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

        {/* PROVINCIAS BASE */}
        {showProvinces && (
          <GeoJSON
            data={argentinaProvinces}
            style={getProvinceStyle}
            onEachFeature={handleProvince}
          />
        )}

        {/* 🔥 OVERLAY PROVINCIA SELECCIONADA */}
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

        {/* MARKERS */}
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