import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { NavigationState, Club } from "../types/types";
import type { UserRoleConfig } from "../data/roles";
import { argentinaProvinces, provinceCenters } from "../data/argentinaGeoJson";
import { getClubes } from "../data/dataUtils";

// --------- Type
interface MapViewControllerProps {
  navigation: NavigationState;      // Estado actual de navegación 
  roleConfig: UserRoleConfig;       // Configuración del rol del usuario
  clubForRole?: Club | null;        // Datos del club si el usuario es de rol "club"
  onNavigateCountry?: () => void;   // Callback para volver a vista de país
}

// ------- Componente controlador de vista del mapa
// Maneja la animación y posicionamiento del mapa según el rol del usuario y navegación
function MapViewController({
  navigation,
  roleConfig,
  clubForRole,
  onNavigateCountry,
}: MapViewControllerProps) {
  const map = useMap();

  const prevNavRef = useRef<string>("");      // Rastrea navegación anterior para evitar re-cálculos innecesarios
  const prevRoleRef = useRef<string>("");     // Rastrea configuración de rol anterior para evitar re-animaciones

  // -------- Auto Reset a vista país para usuarios con rol COA
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

  // -------- Posición de vista inicial según rol del usuario
  // Se ejecuta cuando cambia el rol. Define la "zona permitida" para el usuario.
  useEffect(() => {
    const roleKey = `${roleConfig.role}-${roleConfig.provinciaId}-${roleConfig.municipioId}-${roleConfig.clubId}-${roleConfig.federationScope}`;

    if (roleKey === prevRoleRef.current) return;
    prevRoleRef.current = roleKey;

    // CLUB ROLE — Vuela al club específico
    if (roleConfig.role === "club" && clubForRole) {
      map.flyTo([clubForRole.lat, clubForRole.lng], 14, {
        duration: 1.2,
      });
      return;
    }

    // MUNICIPALITY ROLE — Ajusta a los clubes del municipio
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

    // PROVINCE ROLE or PROVINCIAL FEDERATION — Ajusta a toda la provincia
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

  // -------- Movimiento dentro de la "zona permitida"
  // Se ejecuta cuando el usuario NAVEGA dentro de su rol.
  // Es lo que el usuario elige ver dentro de sus límites de rol (actualizar vista, zoom).
  useEffect(() => {
    const navKey = `${navigation.level}-${navigation.provinciaId}-${navigation.municipioId}`;

    if (navKey === prevNavRef.current) return;
    prevNavRef.current = navKey;

    // Skip para usuarios con rol club (manejado por ROLE BASED VIEW)
    if (roleConfig.role === "club") return;

    // COUNTRY — Vista nacional
    if (navigation.level === "country") {
      map.flyTo([-38.5, -63.5], 5, { duration: 2 });
      return;
    }

    // PROVINCE — Vuela a los límites de la provincia
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

      // Fallback: usa centros predefinidos de provincias si GeoJSON no está disponible
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

    // CITY — Ajusta a los clubes del municipio
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

  // No renderiza nada visible — componente solo controla estado del mapa
  return null;
}

export default MapViewController;