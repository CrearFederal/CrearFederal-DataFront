import { useEffect, useState } from "react";
import { X, MapPin, Landmark, Loader2, Phone, Mail, User, Trophy, Building2 } from "lucide-react";
import type { FederacionDetalleResponse } from "../types/Mapa";
import { getFederacionDetalle } from "../data/federacionesApi";

const COLOR = "#0d9488";
const COLOR_DARK = "#0f766e";

interface FederacionDetailPanelProps {
  federacionId: number;
  onClose: () => void;
}

function FederacionDetailPanel({
  federacionId,
  onClose,
}: FederacionDetailPanelProps) {
  const [data, setData] = useState<FederacionDetalleResponse | null>(null);
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

    getFederacionDetalle(federacionId, controller.signal)
      .then((result) => { if (active) setData(result); })
      .catch((err) => {
        if (!active || isAbortError(err)) return;
        if (active) setError("No se pudo cargar el detalle.");
      })
      .finally(() => { if (active) setLoading(false); });

    return () => {
      active = false;
      controller.abort();
    };
  }, [federacionId]);

  const federacion = data?.federacion;
  const colorBg10 = COLOR + "1a";
  const colorBg15 = COLOR + "26";

  const contactRows = federacion
    ? [
        federacion.telefono && { Icon: Phone, label: federacion.telefono },
        federacion.mail && { Icon: Mail, label: federacion.mail },
        federacion.responsable && { Icon: User, label: federacion.responsable },
      ].filter(Boolean) as { Icon: typeof Phone; label: string }[]
    : [];

  return (
    <div className="panel-slide-in fixed right-0 top-0 z-[60] h-full w-full lg:w-[60vw] overflow-y-auto border-l border-border bg-card shadow-2xl">
      {/* HEADER */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          {federacion?.logoUrl ? (
            <img
              src={federacion.logoUrl}
              alt={federacion.nombre}
              className="h-10 w-10 rounded-full border-2 object-cover shrink-0"
              style={{ borderColor: COLOR }}
            />
          ) : (
            <Landmark className="h-5 w-5 shrink-0" style={{ color: COLOR }} />
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground leading-tight truncate">
              {federacion?.nombre ?? "Cargando..."}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 transition-colors shrink-0"
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = COLOR + "4d"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ""; }}
        >
          <X
            className="h-5 w-5 text-muted-foreground transition-colors"
            onMouseEnter={(e) => { (e.currentTarget as SVGSVGElement).style.color = COLOR; }}
            onMouseLeave={(e) => { (e.currentTarget as SVGSVGElement).style.color = ""; }}
          />
        </button>
      </div>

      {/* CONTENT */}
      <div className="space-y-5 p-4">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: COLOR }} />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {data && federacion && (
          <>
            {/* LOCATION */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{federacion.nombreProvincia}</span>
              </div>
              {federacion.direccion && (
                <p className="pl-6 text-xs text-muted-foreground">{federacion.direccion}</p>
              )}
            </div>

            {/* NIVEL DE ALCANCE */}
            <div
              className="kpi-card fade-up group"
              style={{ "--kpi-top-line": `linear-gradient(90deg, ${COLOR}, ${COLOR}cc)` } as React.CSSProperties}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl transition-all duration-300"
                style={{ background: COLOR }}
              />
              <div className="flex items-start justify-between gap-2 pl-2 text-left w-full">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nivel de alcance</p>
                  <p className="mt-1.5 font-mono font-bold text-foreground leading-none" style={{ fontSize: "clamp(15px, 1.8vw, 22px)" }}>
                    {federacion.nombreNivel || "—"}
                  </p>
                </div>
                <div
                  className="rounded-lg p-2 transition-colors shrink-0"
                  style={{ background: colorBg10, color: COLOR }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = colorBg15; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = colorBg10; }}
                >
                  <Landmark className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* CONTACTO */}
            {contactRows.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ background: colorBg10 }}
                  >
                    <Phone className="h-4 w-4" style={{ color: COLOR }} />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Contacto
                  </p>
                </div>
                <div className="space-y-1.5">
                  {contactRows.map(({ Icon, label }, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-foreground">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DEPORTES */}
            {data.deportes.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ background: colorBg10 }}
                  >
                    <Trophy className="h-4 w-4" style={{ color: COLOR }} />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Deportes asociados
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.deportes.map((deporte) => (
                    <span
                      key={deporte.id_deporte}
                      className="rounded-full px-3 py-1 text-xs font-medium"
                      style={
                        deporte.esPrincipal
                          ? { background: colorBg15, color: COLOR_DARK, border: `1px solid ${COLOR}` }
                          : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                      }
                    >
                      {deporte.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* MUNICIPIOS CUBIERTOS */}
            {data.municipios.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ background: colorBg10 }}
                  >
                    <Building2 className="h-4 w-4" style={{ color: COLOR }} />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Municipios que cubre ({data.municipios.length})
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.municipios.map((municipio) => (
                    <span
                      key={municipio.id_municipio}
                      className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {municipio.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* DEPORTISTAS AFILIADOS */}
            <div
              className="kpi-card fade-up group"
              style={{ "--kpi-top-line": `linear-gradient(90deg, ${COLOR}, ${COLOR}cc)` } as React.CSSProperties}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl transition-all duration-300"
                style={{ background: COLOR }}
              />
              <div className="flex items-start justify-between gap-2 pl-2 text-left w-full">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Deportistas afiliados</p>
                  <p className="mt-1.5 font-mono font-bold text-foreground leading-none" style={{ fontSize: "clamp(15px, 1.8vw, 22px)" }}>
                    {data.totalDeportistas.toLocaleString()}
                  </p>
                </div>
                <div
                  className="rounded-lg p-2 transition-colors shrink-0"
                  style={{ background: colorBg10, color: COLOR }}
                >
                  <User className="h-4 w-4" />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FederacionDetailPanel;
