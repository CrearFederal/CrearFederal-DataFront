import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L, { MarkerClusterGroup as LMarkerClusterGroup } from "leaflet";
import "leaflet.markercluster";

// --------- Types
interface MarkerData {
  lat: number;        
  lng: number;        
  id: number;         
  name: string;       
  address: string;    
  logoUrl?: string;   
}

interface MarkerClusterGroupProps {
  markers: MarkerData[];           // Array de datos de marcadores a mostrar
  onMarkerClick: (id: number) => void;  // Callback cuando usuario hace click en marcador
}

// --------- Funciones para crear elementos visuales
// Crea el ícono personalizado para clusters (agrupa múltiples marcadores)
// Cambia de tamaño según cantidad de markers dentro: small (≤10), medium (≤30), large (>30)
function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount();

  let size = "small";
  if (count > 10) size = "medium";
  if (count > 30) size = "large";

  return L.divIcon({
    html: `<div class="cluster-icon cluster-${size}">${count}</div>`,
    className: "custom-cluster",
    iconSize: L.point(40, 40),
  });
}

// Crea el ícono visual para cada marcador individual
// Si el club tiene logo, muestra el logo. Si no, muestra punto genérico pequeño
function createMarkerIcon(marker: MarkerData) {
  if (marker.logoUrl) {
    return L.divIcon({
      html: `<div class="club-logo-marker">
              <img src="${marker.logoUrl}" alt="" />
            </div>`,
      className: "custom-marker",
      iconSize: L.point(28, 28),
      iconAnchor: L.point(14, 14),
    });
  }

  return L.divIcon({
    html: `<div class="club-marker-icon"></div>`,
    className: "custom-marker",
    iconSize: L.point(12, 12),
    iconAnchor: L.point(6, 6),
  });
}

function createTooltip(marker: MarkerData) {
  return `
    <div class="club-tooltip-content">
      ${
        marker.logoUrl
          ? `<img src="${marker.logoUrl}" class="club-tooltip-logo" />`
          : ""
      }
      <span>${marker.name}</span>
    </div>
  `;
}

// ------- Componente para gestionar cluster de marcadores con agrupación
// Crea, actualiza y maneja eventos de múltiples marcadores de clubs
// Los marcadores se agrupan automáticamente cuando están cerca (cluster)
function MarkerClusterGroup({
  markers,
  onMarkerClick,
}: MarkerClusterGroupProps) {
  const map = useMap();
  const clusterRef = useRef<LMarkerClusterGroup | null>(null);

  // -------- Crear e inicializar el cluster group la primera vez
  // Configura propiedades: agrupación por proximidad, animaciones, comportamiento al hacer click
  useEffect(() => {
    const cluster = (L as any).markerClusterGroup({
      chunkedLoading: true,           
      maxClusterRadius: 50,        
      spiderfyOnMaxZoom: true,           
      showCoverageOnHover: false,   
      animateAddingMarkers: true,        
      zoomToBoundsOnClick: true,   
      iconCreateFunction: createClusterIcon
    });

    clusterRef.current = cluster;
    map.addLayer(cluster);

    return () => {
      map.removeLayer(cluster);
    };
  }, [map]);

  // -------- Update de marcadores en el cluster cada vez que cambian los datos
  // Limpia los anteriores y crea nuevos con sus tooltips y eventos de click
  useEffect(() => {
    if (!clusterRef.current) return;

    const cluster = clusterRef.current;

    // Elimina todos los marcadores anteriores
    cluster.clearLayers();

    // Itera sobre cada marcador, crea su ícono, tooltip y evento de click
    markers.forEach((m) => {
      const marker = L.marker([m.lat, m.lng], {
        icon: createMarkerIcon(m),   
      });

      // Bind tooltip que aparece al pasar mouse sobre marcador
      marker.bindTooltip(createTooltip(m), {
        direction: "top",          
        offset: L.point(0, -12),    
        className: "club-tooltip",    
      });

      // Evento: disparar callback cuando usuario hace click
      marker.on("click", () => onMarkerClick(m.id));

      // Agregar marcador al cluster
      cluster.addLayer(marker);
    });
  }, [markers, onMarkerClick]);

  // No renderiza nada visible — componente solo controla estado del cluster
  return null;
}

export default MarkerClusterGroup;