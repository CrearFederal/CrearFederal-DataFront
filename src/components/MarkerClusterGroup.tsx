import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L, { MarkerClusterGroup as LMarkerClusterGroup } from "leaflet";
import "leaflet.markercluster";

// ---------------- TYPES ----------------

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

// ---------------- HELPERS ----------------

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

// ---------------- COMPONENT ----------------

function MarkerClusterGroup({
  markers,
  onMarkerClick,
}: MarkerClusterGroupProps) {
  const map = useMap();
  const clusterRef = useRef<LMarkerClusterGroup | null>(null);

  // -------- INIT CLUSTER --------

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

  // -------- UPDATE MARKERS --------

  useEffect(() => {
    if (!clusterRef.current) return;

    const cluster = clusterRef.current;

    // Limpia markers anteriores SIN recrear cluster
    cluster.clearLayers();

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

      cluster.addLayer(marker);
    });
  }, [markers, onMarkerClick]);

  return null;
}

export default MarkerClusterGroup;