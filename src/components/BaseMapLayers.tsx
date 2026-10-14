import { TileLayer } from "react-leaflet";

/**
 * Mapa base gris claro de Esri (ArcGIS Online).
 * Gratuito y SIN API key: no requiere cuenta ni tarjeta, por lo que no puede generar cargos.
 * Reemplaza a CARTO (basemaps.cartocdn.com), que pasó a exigir API key.
 *
 * Se compone de dos capas, igual que el original de Esri:
 *  - Base: relieve, agua, rutas y manchas urbanas en gris claro.
 *  - Reference: etiquetas (nombres de provincias, ciudades, países) por encima.
 */
export const BASEMAP_URL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";

export const BASEMAP_LABELS_URL =
  "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}";

export const BASEMAP_ATTRIBUTION =
  "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ";

export default function BaseMapLayers() {
  return (
    <>
      <TileLayer url={BASEMAP_URL} attribution={BASEMAP_ATTRIBUTION} maxNativeZoom={16} maxZoom={19} />
      <TileLayer url={BASEMAP_LABELS_URL} maxNativeZoom={16} maxZoom={19} />
    </>
  );
}
