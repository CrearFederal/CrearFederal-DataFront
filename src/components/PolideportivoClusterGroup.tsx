import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L, { MarkerClusterGroup as LMarkerClusterGroup } from "leaflet";
import "leaflet.markercluster";
import type { Polideportivo } from "../types/Mapa";

function createClusterIcon(color: string) {
  return function (cluster: any) {
    const count = cluster.getChildCount();
    const size = count > 30 ? 44 : count > 10 ? 38 : 32;
    return L.divIcon({
      html: `<div style="
        width:${size}px;height:${size}px;
        background:${color};
        border:2.5px solid white;
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        color:white;font-weight:700;font-size:${size < 38 ? 11 : 12}px;font-family:inherit;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
      ">${count}</div>`,
      className: "",
      iconSize: L.point(size, size),
      iconAnchor: L.point(size / 2, size / 2),
    });
  };
}

function createMarkerIcon(color: string, logoUrl?: string | null) {
  if (logoUrl) {
    return L.divIcon({
      html: `<div style="
        width:28px;height:28px;
        border-radius:50%;
        overflow:hidden;
        border:2.5px solid ${color};
        box-shadow:0 2px 6px rgba(0,0,0,0.25);
        background:white;
        transition:transform 0.2s ease;
      ">
        <img src="${logoUrl}" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'" />
      </div>`,
      className: "",
      iconSize: L.point(28, 28),
      iconAnchor: L.point(14, 14),
    });
  }

  return L.divIcon({
    html: `<div style="
      width:10px;height:10px;
      background:${color};
      border:2px solid white;
      border-radius:50%;
      box-shadow:0 1px 5px rgba(0,0,0,0.3);
      transition:transform 0.2s ease;
    "></div>`,
    className: "",
    iconSize: L.point(10, 10),
    iconAnchor: L.point(5, 5),
  });
}

interface PolideportivoClusterGroupProps {
  polideportivos: Polideportivo[];
  color: string;
  colorDark: string;
  onPolideportivoClick?: (id: number) => void;
}

function PolideportivoClusterGroup({
  polideportivos,
  color,
  colorDark,
  onPolideportivoClick,
}: PolideportivoClusterGroupProps) {
  const map = useMap();
  const clusterRef = useRef<LMarkerClusterGroup | null>(null);

  useEffect(() => {
    const cluster = (L as any).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      animateAddingMarkers: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: createClusterIcon(color),
    });

    clusterRef.current = cluster;
    map.addLayer(cluster);

    return () => {
      map.removeLayer(cluster);
    };
  }, [map, color]);

  useEffect(() => {
    if (!clusterRef.current) return;
    const cluster = clusterRef.current;
    cluster.clearLayers();

    const leafletMarkers: L.Marker[] = polideportivos
      .filter((p) => p.lat !== 0 && p.lng !== 0)
      .map((p) => {
        const marker = L.marker([p.lat, p.lng], { icon: createMarkerIcon(color, p.logoUrl) });
        const logo = p.logoUrl
          ? `<img src="${p.logoUrl}" class="club-tooltip-logo" style="border-color:${color}" />`
          : "";
        const address = p.direccion
          ? `<br/><span style="color:#64748b;font-size:11px">${p.direccion}</span>`
          : "";
        marker.bindTooltip(
          `<div class="club-tooltip-content">${logo}<div><strong style="color:${colorDark}">${p.nombre}</strong>${address}</div></div>`,
          { direction: "top", offset: L.point(0, -8), className: "club-tooltip" }
        );
        if (onPolideportivoClick) {
          marker.on("click", () => onPolideportivoClick(p.id));
        }
        return marker;
      });

    cluster.addLayers(leafletMarkers);
  }, [polideportivos, onPolideportivoClick, color, colorDark]);

  return null;
}

export default PolideportivoClusterGroup;
