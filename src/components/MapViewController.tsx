import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

import L from "leaflet";

import type { NavigationState, Club } from "../types/types";
import type { UserRoleConfig } from "../data/roles";
import {
  argentinaProvinces,
  provinceCenters,
} from "../data/argentinaGeoJson";
import { getClubes } from "../data/dataUtils";

// ---------------- TYPES ----------------

interface MapViewControllerProps {
  navigation: NavigationState;
  roleConfig: UserRoleConfig;
  clubForRole?: Club | null;
  onNavigateCountry?: () => void;
}

// ---------------- COMPONENT ----------------

function MapViewController({
  navigation,
  roleConfig,
  clubForRole,
  onNavigateCountry,
}: MapViewControllerProps) {
  const map = useMap();

  const prevNavRef = useRef<string>("");
  const prevRoleRef = useRef<string>("");

  // -------- AUTO RESET (zoom out → country) --------

  useEffect(() => {
    if (!onNavigateCountry || roleConfig.role !== "coa") return;

    const handleZoomEnd = () => {
      if (navigation.level !== "country" && map.getZoom() <= 4) {
        onNavigateCountry();
      }
    };

    map.on("zoomend", handleZoomEnd);

    return () => {
      map.off("zoomend", handleZoomEnd);
    };
  }, [map, navigation.level, onNavigateCountry, roleConfig.role]);

  // -------- ROLE BASED VIEW --------

  useEffect(() => {
    const roleKey = `${roleConfig.role}-${roleConfig.provinciaId}-${roleConfig.municipioId}-${roleConfig.clubId}-${roleConfig.federationScope}`;

    if (roleKey === prevRoleRef.current) return;
    prevRoleRef.current = roleKey;

    // CLUB ROLE
    if (roleConfig.role === "club" && clubForRole) {
      map.flyTo([clubForRole.lat, clubForRole.lng], 14, {
        duration: 1.2,
      });
      return;
    }

    // MUNICIPALITY ROLE — zoom to the municipality's clubs
    if (roleConfig.role === "municipality" && roleConfig.municipioId) {
      const clubs = getClubes({
        provinciaId: roleConfig.provinciaId,
        municipioId: roleConfig.municipioId,
      });

      if (clubs.length > 0) {
        const bounds = L.latLngBounds(
          clubs.map((c) => [c.lat, c.lng] as [number, number])
        );
        map.flyToBounds(bounds.pad(0.3), { duration: 1.2, maxZoom: 13 });
      }
      return;
    }

    // PROVINCE ROLE or PROVINCIAL FEDERATION
    if (
      (roleConfig.role === "province" ||
        (roleConfig.role === "federation" && roleConfig.federationScope === "provincial")) &&
      roleConfig.provinciaId
    ) {
      const feature = argentinaProvinces.features.find(
        (f) => f.properties.id_provincia === roleConfig.provinciaId
      );

      if (feature) {
        const layer = L.geoJSON(feature as any);
        map.flyToBounds(layer.getBounds().pad(0.1), {
          duration: 1.2,
        });
      }
    }
  }, [map, roleConfig, clubForRole]);

  // -------- NAVIGATION VIEW --------

  useEffect(() => {
    const navKey = `${navigation.level}-${navigation.provinciaId}-${navigation.municipioId}`;

    if (navKey === prevNavRef.current) return;
    prevNavRef.current = navKey;

    // Skip for club role
    if (roleConfig.role === "club") return;

    // COUNTRY
    if (navigation.level === "country") {
      map.flyTo([-38.5, -63.5], 4, { duration: 2 });
      return;
    }

    // PROVINCE
    if (
      navigation.level === "province" &&
      navigation.provinciaId
    ) {
      const feature = argentinaProvinces.features.find(
        (f) =>
          f.properties.id_provincia ===
          navigation.provinciaId
      );

      if (feature) {
        const layer = L.geoJSON(feature as any);
        map.flyToBounds(layer.getBounds().pad(0.1), {
          duration: 1.2,
        });
        return;
      }

      const center = provinceCenters[navigation.provinciaId];

      if (center) {
        map.flyTo(
          [center.lat, center.lng],
          center.zoom,
          { duration: 1.2 }
        );
      }

      return;
    }

    // CITY
    if (
      navigation.level === "city" &&
      navigation.municipioId
    ) {
      const clubs = getClubes({
        provinciaId: navigation.provinciaId,
        municipioId: navigation.municipioId,
      });

      if (clubs.length > 0) {
        const bounds = L.latLngBounds(
          clubs.map((c) => [c.lat, c.lng] as [number, number])
        );

        map.flyToBounds(bounds.pad(0.3), {
          duration: 1.2,
          maxZoom: 13,
        });
      }
    }
  }, [map, navigation, roleConfig.role]);

  return null;
}

export default MapViewController;