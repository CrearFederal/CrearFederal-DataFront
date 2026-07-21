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
  markers: MarkerData[];
  onMarkerClick: (id: number) => void;
}

// --------- Funciones para crear elementos visuales
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

function createMarkerIcon(marker: MarkerData) {
  if (marker.logoUrl) {
    return L.divIcon({
      html: `<div class="club-logo-marker">
              <img src="${marker.logoUrl}" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'" />
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
  const logo = marker.logoUrl
    ? `<img src="${marker.logoUrl}" class="club-tooltip-logo" />`
    : "";
  const address = marker.address
    ? `<br/><span style="color:#64748b;font-size:11px">${marker.address}</span>`
    : "";
  return `
    <div class="club-tooltip-content">
      ${logo}
      <div><strong style="color:hsl(215,70%,45%)">${marker.name}</strong>${address}</div>
    </div>
  `;
}

// ------- Componente para gestionar cluster de marcadores con agrupación
function MarkerClusterGroup({ markers, onMarkerClick }: MarkerClusterGroupProps) {
  const map = useMap();
  const clusterRef = useRef<LMarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());

  useEffect(() => {
    const cluster = (L as any).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      animateAddingMarkers: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: createClusterIcon,
    });

    clusterRef.current = cluster;
    map.addLayer(cluster);

    return () => {
      map.removeLayer(cluster);
    };
  }, [map]);

  useEffect(() => {
    if (!clusterRef.current) return;

    const cluster = clusterRef.current;

    cluster.clearLayers();
    markersRef.current.clear();

    const leafletMarkers: L.Marker[] = [];

    markers.forEach((m) => {
      const marker = L.marker([m.lat, m.lng], {
        icon: createMarkerIcon(m),
      });

      marker.bindTooltip(createTooltip(m), {
        direction: "top",
        offset: L.point(0, -12),
        className: "club-tooltip",
      });

      marker.on("click", () => onMarkerClick(m.id));
      markersRef.current.set(m.id, marker);
      leafletMarkers.push(marker);
    });

    cluster.addLayers(leafletMarkers);
  }, [markers, onMarkerClick]);

  return null;
}

export default MarkerClusterGroup;
