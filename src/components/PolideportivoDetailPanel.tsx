import { useEffect, useState } from "react";
import { X, MapPin, LandPlot, Loader2, Building2 } from "lucide-react";
import type { PolideportivoDetalleResponse } from "../types/Mapa";
import { getPolideportivoDetalle } from "../data/polideportivosApi";
import { INFRA_ITEMS, InfraCard } from "./ClubDetailPanel";

// -------- PROPS --------

interface PolideportivoDetailPanelProps {
  polideportivoId: number;
  onClose: () => void;
}

// -------- COMPONENT --------

function PolideportivoDetailPanel({ polideportivoId, onClose }: PolideportivoDetailPanelProps) {
  const [data, setData] = useState<PolideportivoDetalleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAbortError = (value: unknown): boolean => {
    if (value instanceof DOMException && value.name === "AbortError") return true;
    if (typeof value === "object" && value !== null) {
      const err = value as { name?: string; code?: string };
      return err.name === "CanceledError" || err.code === "ERR_CANCELED";
    }
    return false;
  };

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError(null);
    setData(null);

    getPolideportivoDetalle(polideportivoId, controller.signal)
      .then((result) => { if (active) setData(result); })
      .catch((err) => {
        if (!active || isAbortError(err)) return;
        if (active) setError("No se pudo cargar el detalle del polideportivo.");
      })
      .finally(() => { if (active) setLoading(false); });

    return () => {
      active = false;
      controller.abort();
    };
  }, [polideportivoId]);

  const infraItems = data?.conteoInfraestructura
    ? INFRA_ITEMS.filter((item) => (data.conteoInfraestructura[item.key] ?? 0) > 0)
    : [];

  return (
    <div className="panel-slide-in fixed right-0 top-0 z-[60] h-full w-full lg:w-[60vw] overflow-y-auto border-l border-border bg-card shadow-2xl">
      {/* HEADER */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          {data?.polideportivo.logoUrl ? (
            <img
              src={data.polideportivo.logoUrl}
              alt={data.polideportivo.nombre}
              className="h-10 w-10 rounded-full border-2 border-orange-400 object-cover shrink-0"
            />
          ) : (
            <LandPlot className="h-5 w-5 text-orange-400 shrink-0" />
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground leading-tight truncate">
              {data?.polideportivo.nombre ?? "Cargando..."}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 transition-colors hover:bg-orange-500/20 shrink-0"
        >
          <X className="h-5 w-5 text-muted-foreground hover:text-orange-500" />
        </button>
      </div>

      {/* CONTENT */}
      <div className="space-y-5 p-4">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-orange-400" />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {data && (
          <>
            {/* LOCATION */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{data.polideportivo.nombreMunicipio}, {data.polideportivo.nombreProvincia}</span>
              </div>
              {data.polideportivo.direccion && (
                <p className="pl-6 text-xs text-muted-foreground">{data.polideportivo.direccion}</p>
              )}
            </div>

            {/* TIPO */}
            <div className="kpi-card kpi-card--orange fade-up group">
              <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-orange-400/60 transition-all duration-300 group-hover:bg-orange-400" />
              <div className="flex items-start justify-between gap-2 pl-2 text-left w-full">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo</p>
                  <p className="mt-1.5 font-mono font-bold text-foreground leading-none" style={{ fontSize: "clamp(15px, 1.8vw, 22px)" }}>
                    {data.polideportivo.tipo}
                  </p>
                </div>
                <div className="rounded-lg bg-orange-500/10 p-2 text-orange-500 transition-colors group-hover:bg-orange-500/15 shrink-0">
                  <LandPlot className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* CONTEO DE INFRAESTRUCTURA */}
            {infraItems.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10">
                    <Building2 className="h-4 w-4 text-orange-500" />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Infraestructura del polideportivo
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {infraItems.map((item, index) => (
                    <InfraCard
                      key={item.key}
                      index={index}
                      label={item.label}
                      count={data.conteoInfraestructura[item.key]}
                      image={item.image}
                      color={item.color}
                      accentHex={item.accentHex}
                      ring={item.ring}
                      blurred={item.blurred}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PolideportivoDetailPanel;
