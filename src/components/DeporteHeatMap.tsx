import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { DeporteProvinciasResponse } from "../data/statsApi";
import { argentinaProvinces } from "../data/argentinaGeoJson";

interface DeporteHeatMapProps {
  data: DeporteProvinciasResponse | null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const HEAT_COLOR_STOPS = [
  { ratio: 0, h: 220, s: 14, l: 93 },
  { ratio: 0.14, h: 186, s: 42, l: 80 },
  { ratio: 0.32, h: 162, s: 52, l: 58 },
  { ratio: 0.52, h: 48, s: 90, l: 62 },
  { ratio: 0.74, h: 26, s: 88, l: 54 },
  { ratio: 1, h: 355, s: 72, l: 46 },
] as const;

const NO_DATA_COLOR = "hsl(220, 14%, 93%)";
const PROVINCE_BORDER = "rgba(226, 232, 240, 0.9)";
const PROVINCE_BORDER_ACTIVE = "rgba(203, 213, 225, 0.75)";
const HEAT_HOVER_BORDER = "rgb(211, 216, 222)";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function interpolateHeatColor(ratio: number) {
  const clampedRatio = clamp(ratio, 0, 1);
  const upperIndex = HEAT_COLOR_STOPS.findIndex((stop) => stop.ratio >= clampedRatio);
  const upper = HEAT_COLOR_STOPS[upperIndex >= 0 ? upperIndex : HEAT_COLOR_STOPS.length - 1];
  const lower = HEAT_COLOR_STOPS[Math.max(0, upperIndex - 1)];
  const span = upper.ratio - lower.ratio || 1;
  const t = (clampedRatio - lower.ratio) / span;

  const h = lerp(lower.h, upper.h, t);
  const s = lerp(lower.s, upper.s, t);
  const l = lerp(lower.l, upper.l, t);

  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

export function getProvinceHeatColor(value: number, maxValue: number) {
  if (value <= 0 || maxValue <= 0) {
    return NO_DATA_COLOR;
  }

  return interpolateHeatColor(Math.min(1, value / maxValue));
}

function buildLegendGradient() {
  const stops = HEAT_COLOR_STOPS.map((stop) => `${interpolateHeatColor(stop.ratio)} ${stop.ratio * 100}%`).join(", ");
  return `linear-gradient(to right, ${stops})`;
}

function buildLegendSteps(maxValue: number) {
  return [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    ratio,
    color: getProvinceHeatColor(ratio * maxValue, maxValue),
    value: Math.round(ratio * maxValue),
    label: ratio === 0 ? "0" : Math.round(ratio * maxValue).toLocaleString("es-AR"),
  }));
}

function HeatMapFitBounds({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds.pad(0.08), { animate: false, padding: [18, 18] });
  }, [map, bounds]);

  return null;
}

interface ProvinceLayerEntry {
  layer: L.Path;
  feature: GeoJSON.Feature;
}

function HeatMapGeoLayer({
  provinceById,
  maxValue,
}: {
  provinceById: Map<number, DeporteProvinciasResponse["provincias"][number]>;
  maxValue: number;
}) {
  const map = useMap();
  const layersRef = useRef<Map<number, ProvinceLayerEntry>>(new Map());
  const hoveredProvinceRef = useRef<number | null>(null);

  const getBaseStyle = (feature: GeoJSON.Feature) => {
    const provinceId = feature?.properties?.id_provincia as number | undefined;
    const province = provinceId !== undefined ? provinceById.get(provinceId) : undefined;
    const total = province?.totalDeportistas ?? 0;

    return {
      fillColor: getProvinceHeatColor(total, maxValue),
      fillOpacity: province ? 0.72 : 0.28,
      color: province ? PROVINCE_BORDER_ACTIVE : PROVINCE_BORDER,
      weight: province ? 1.2 : 0.9,
      opacity: 1,
    };
  };

  const getHoverStyle = (feature: GeoJSON.Feature) => {
    const baseStyle = getBaseStyle(feature);
    return {
      ...baseStyle,
      weight: 2.2,
      color: HEAT_HOVER_BORDER,
      fillOpacity: baseStyle.fillOpacity > 0 ? 0.88 : 0.4,
    };
  };

  useEffect(() => {
    const layers = layersRef.current;
    layers.clear();
    hoveredProvinceRef.current = null;

    const geoJsonLayer = L.geoJSON(argentinaProvinces as GeoJSON.FeatureCollection, {
      style: (feature) => (feature ? getBaseStyle(feature) : {}),
      onEachFeature: (feature, layer) => {
        if (!feature) return;

        const provinceId = feature.properties?.id_provincia as number | undefined;
        const province = provinceId !== undefined ? provinceById.get(provinceId) : undefined;
        const total = province?.totalDeportistas ?? 0;
        const totalClubes = province?.totalClubes ?? 0;
        const totalMujeres = province?.totalMujeres ?? 0;
        const totalHombres = province?.totalHombres ?? 0;
        const porcentaje = province?.porcentaje ?? 0;

        const tooltipHtml = `
          <div style="min-width:180px;">
            <div style="font-weight:700;color:#3b82f6;font-size:15px;">${feature?.properties?.nombre ?? "Provincia"}</div>
            <div style="margin-top:4px;color:#475569;font-size:12px;">Deportistas: <strong style="color:#0f172a;">${total.toLocaleString("es-AR")}</strong></div>
            <div style="color:#475569;font-size:12px;">Clubes: <strong style="color:#0f172a;">${totalClubes.toLocaleString("es-AR")}</strong></div>
            <div style="color:#475569;font-size:12px;">Participación: <strong style="font-size:14px;color:#a78bfa;font-weight:700;">${porcentaje}%</strong></div>
            <div style="margin-top:4px;color:#475569;font-size:12px;">Hombres: <strong style="color:#2563eb;">${totalHombres.toLocaleString("es-AR")}</strong></div>
            <div style="color:#475569;font-size:12px;">Mujeres: <strong style="color:#db2777;">${totalMujeres.toLocaleString("es-AR")}</strong></div>
          </div>
        `;

        layer.bindTooltip(tooltipHtml, { sticky: true, opacity: 1 });

        if (provinceId !== undefined) {
          layers.set(provinceId, {
            layer: layer as L.Path,
            feature,
          });
        }

        (layer as L.Path).on({
          mouseover: (event) => {
            if (provinceId !== undefined) {
              hoveredProvinceRef.current = provinceId;
            }
            const target = event.target as L.Path;
            target.setStyle(getHoverStyle(feature));
            target.bringToFront();
          },
          mouseout: (event) => {
            hoveredProvinceRef.current = null;
            const target = event.target as L.Path;
            target.setStyle(getBaseStyle(feature));
          },
        });
      },
    });

    geoJsonLayer.addTo(map);

    return () => {
      geoJsonLayer.remove();
      layers.clear();
      hoveredProvinceRef.current = null;
    };
  }, [map, provinceById, maxValue]);

  useEffect(() => {
    layersRef.current.forEach(({ layer, feature }, provinceId) => {
      if (hoveredProvinceRef.current === provinceId) return;
      layer.setStyle(getBaseStyle(feature));
    });
  }, [maxValue, provinceById]);

  return null;
}

function HeatMapLegend({
  maxValue,
  minActiveValue,
  sportName,
}: {
  maxValue: number;
  minActiveValue: number;
  sportName?: string;
}) {
  const legendGradient = useMemo(() => buildLegendGradient(), []);
  const legendSteps = useMemo(() => buildLegendSteps(maxValue), [maxValue]);

  return (
    <div
      className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-xl border border-border/70 bg-card/95 shadow-lg backdrop-blur-sm w-[130px] px-2 py-1.5 sm:w-[calc(100%-5.5rem)] sm:max-w-80 sm:px-3.5 sm:py-3"
      role="img"
      aria-label={`Leyenda del mapa de calor. Máximo: ${maxValue.toLocaleString("es-AR")} deportistas por provincia.`}
    >
      {/* Mobile: solo gradiente + min/max */}
      <div className="sm:hidden">
        <div className="h-3 w-full rounded-md border border-border/60" style={{ background: legendGradient }} aria-hidden="true" />
        <div className="mt-1 flex justify-between text-[8px] text-muted-foreground">
          <span>0</span>
          <span className="font-medium text-foreground">{maxValue.toLocaleString("es-AR")}</span>
        </div>
        {sportName && <p className="mt-1 text-[8px] text-primary truncate font-medium">{sportName}</p>}
      </div>

      {/* Desktop: leyenda completa */}
      <div className="hidden sm:block">
        <div className="mb-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Referencia de color</p>
          <p className="text-xs font-medium text-foreground mt-0.5">Cantidad de deportistas por provincia</p>
          {sportName && <p className="text-[11px] text-primary mt-0.5 truncate font-medium">{sportName}</p>}
        </div>
        <div className="relative">
          <div className="h-4 w-full rounded-md border border-border/60 shadow-inner" style={{ background: legendGradient }} aria-hidden="true" />
          <div className="absolute inset-x-0 top-0 flex justify-between px-0.5">
            {legendSteps.map((step) => (
              <span key={step.ratio} className="h-4 w-px bg-white/40" aria-hidden="true" />
            ))}
          </div>
        </div>
        <div className="mt-1 grid grid-cols-5 gap-0.5 text-[9px] text-muted-foreground">
          {legendSteps.map((step) => (
            <span key={step.ratio} className={`truncate ${step.ratio === 1 ? "text-right font-medium text-foreground" : step.ratio === 0 ? "text-left" : "text-center"}`}>
              {step.label}
            </span>
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between text-[9px] text-muted-foreground">
          <span>Menor</span>
          <span>Mayor concentración</span>
        </div>
        <div className="mt-2.5 grid grid-cols-5 gap-1">
          {legendSteps.map((step) => (
            <div key={`swatch-${step.ratio}`} className="flex flex-col items-center gap-1">
              <span className="h-3 w-full rounded-sm border border-border/50 shadow-sm" style={{ background: step.color }} aria-hidden="true" />
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/60 pt-2 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-border/60" style={{ background: NO_DATA_COLOR }} />
            Sin datos
          </span>
          {minActiveValue > 0 && (
            <span>Mín.: <strong className="font-medium text-foreground">{minActiveValue.toLocaleString("es-AR")}</strong></span>
          )}
          <span>Máx.: <strong className="font-medium text-foreground">{maxValue.toLocaleString("es-AR")}</strong></span>
        </div>
      </div>
    </div>
  );
}

export function DeporteHeatMap({ data }: DeporteHeatMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e: TouchEvent) => e.preventDefault();
    el.addEventListener("touchmove", prevent, { passive: false });
    return () => el.removeEventListener("touchmove", prevent);
  }, []);

  const provinceById = useMemo(
    () => new Map((data?.provincias ?? []).map((province) => [province.id_provincia, province] as const)),
    [data]
  );

  const maxValue = useMemo(
    () => Math.max(...(data?.provincias ?? []).map((province) => province.totalDeportistas), 0),
    [data]
  );

  const minActiveValue = useMemo(() => {
    const activeValues = (data?.provincias ?? [])
      .map((province) => province.totalDeportistas)
      .filter((value) => value > 0);

    return activeValues.length > 0 ? Math.min(...activeValues) : 0;
  }, [data]);

  const bounds = useMemo(() => L.geoJSON(argentinaProvinces as GeoJSON.FeatureCollection).getBounds().pad(0.08), []);

  return (
    <div ref={containerRef} className="relative h-full min-h-[360px] overflow-hidden rounded-xl border border-border bg-background/70">
      <MapContainer
        className="h-full w-full touch-none"
        center={[-38.5, -63.5]}
        zoom={4}
        minZoom={4}
        maxZoom={18}
        maxBounds={[[-55.5, -73.5], [-21.5, -53.0]]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={false}
        attributionControl={false}
        zoomControl={true}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
        <HeatMapFitBounds bounds={bounds} />
        <HeatMapGeoLayer provinceById={provinceById} maxValue={maxValue} />
      </MapContainer>

      <HeatMapLegend
        maxValue={maxValue}
        minActiveValue={minActiveValue}
        sportName={data?.deporte.nombre}
      />
    </div>
  );
}

export default DeporteHeatMap;
