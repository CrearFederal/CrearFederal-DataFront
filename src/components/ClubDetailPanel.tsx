import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Building2,
  MapPin,
  Users,
  Trophy,
  Loader2,
} from "lucide-react";

import type { ClubDetalleResponse, ConteoInfraestructura } from "../types/Clubes";
import { getClubDetalle } from "../data/clubesApi";
import { edadesFrecuenciaToAges } from "../data/dataUtils";

import KpiCard from "./KpiCard";
import {
  AthletesPerSportChart,
  AgeDistributionChart,
} from "./Charts";

import imgFutbol   from "../../assets/Futbol.png";
import imgTenis    from "../../assets/Tenis.png";
import imgNatacion from "../../assets/Pileta.png";
import imgBasket   from "../../assets/Basket.png";
import imgVoley    from "../../assets/Voley.png";
import imgRugby    from "../../assets/Rugby.png";
import imgHockey   from "../../assets/Hockey.png";
import imgPadel    from "../../assets/Padel.png";
import imgAtletismo from "../../assets/Atletismo.png";
import imgArco from "../../assets/TiroConArco.png";
import imgHandball from "../../assets/Handball.png";
import imgFutsal from "../../assets/Futsal.png";
import imgBochas from "../../assets/Bochas.png";
import imgSUM from "../../assets/SUM.png";
import otros       from "../../assets/Otras.png";

// ---------------- INFRAESTRUCTURA ----------------

interface InfraItemConfig {
  key: keyof ConteoInfraestructura;
  label: string;
  image: string | null;
  color: string;
  accentHex: string;
  ring: string;
  blurred?: boolean;
}

export const INFRA_ITEMS: InfraItemConfig[] = [
  { key: "CanchaFutbol",   label: "CANCHAS DE FÚTBOL",    image: imgFutbol,   color: "text-green-600",   accentHex: "#16a34a", ring: "hover:ring-green-600" },
  { key: "CanchaBasquet",  label: "CANCHAS DE BÁSQUET",   image: imgBasket,   color: "text-orange-400",  accentHex: "#f97316", ring: "hover:ring-orange-400" },
  { key: "CanchaHockey",   label: "CANCHAS DE HOCKEY",    image: imgHockey,   color: "text-green-700",   accentHex: "#0b6e2f", ring: "hover:ring-green-700" },
  { key: "CanchaTenis",    label: "CANCHAS DE TENIS",     image: imgTenis,    color: "text-amber-600",   accentHex: "#d97706", ring: "hover:ring-amber-600" },
  { key: "CanchaVoley",    label: "CANCHAS DE VOLEY",     image: imgVoley,    color: "text-orange-400",  accentHex: "#f97316", ring: "hover:ring-orange-400" },
  { key: "CanchaNatacion", label: "PILETAS DE NATACIÓN",  image: imgNatacion, color: "text-cyan-600",    accentHex: "#0891b2", ring: "hover:ring-cyan-600" },
  { key: "CanchaRugby",    label: "CANCHAS DE RUGBY",     image: imgRugby,    color: "text-green-600",   accentHex: "#059669", ring: "hover:ring-green-600" },
  { key: "CanchaPadel",    label: "CANCHAS DE PÁDEL",     image: imgPadel,    color: "text-indigo-700", accentHex: "#4338ca", ring: "hover:ring-indigo-700" },
  { key: "CanchaAtletismo",label: "PISTAS DE ATLETISMO", image: imgAtletismo, color: "text-amber-600",    accentHex: "#d97706", ring: "hover:ring-amber-600" },
  { key: "CanchaTiroConArco",     label: "CAMPO DE TIRO CON ARCO", image: imgArco, color: "text-green-600", accentHex: "#16a34a", ring: "hover:ring-green-600" },
  { key: "CanchaHandball", label: "CANCHAS DE HANDBALL",  image: imgHandball, color: "text-sky-600", accentHex: "#0284c7", ring: "hover:ring-sky-600" },
  { key: "CanchaFutsal",   label: "CANCHAS DE FUTSAL",    image: imgFutsal,   color: "text-orange-300",   accentHex: "#f97316", ring: "hover:ring-orange-300" },
  { key: "CanchaBochas",   label: "CANCHAS DE BOCHAS",    image: imgBochas,   color: "text-sky-700", accentHex: "#056196", ring: "hover:ring-sky-700" },
  { key: "CanchaMultiples", label: "SALÓN DE USOS MÚLTIPLES", image: imgSUM,   color: "text-yellow-600",     accentHex: "#c7910e", ring: "hover:ring-yellow-600" },
  { key: "Otros",          label: "OTRAS INSTALACIONES",  image: otros,       color: "text-slate-500",   accentHex: "#64748b", ring: "hover:ring-slate-400", blurred: true },
];

export function InfraCard({ label, count, image, color, accentHex, ring, index, blurred }: { label: string; count: number; image: string | null; color: string; accentHex: string; ring: string; index: number; blurred?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      className="group relative isolate rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      {/* Per-sport accent bar, mirrors .kpi-card::before */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] z-[1]"
        style={{ background: `linear-gradient(90deg, ${accentHex}, ${accentHex}99)` }}
      />

      {/* Framed viewport: light matte around the image so its native black canvas reads as an
          intentional "showcase slot" rather than a clashing full-bleed background. */}
      <div className="p-2 pt-2.5">
        <div
          className={`relative aspect-[4/3] overflow-hidden rounded-lg bg-gradient-to-br from-slate-200 to-slate-400 ring-1 ring-black/10 transition-all duration-300 group-hover:ring-2 ${ring}`}
        >
          {image ? (
            <img
              src={image}
              alt={label}
              className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 ${
                blurred ? "scale-125 opacity-35 blur-md" : ""
              }`}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900" />
          )}
          {blurred && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-300/70 via-slate-400/60 to-slate-500/70" />
          )}
        </div>
      </div>

      {/* Info footer, on the light card chrome */}
      <div className="relative flex items-center justify-between gap-2 px-2.5 pb-2.5">
        <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide leading-tight text-muted-foreground">
          {label}
        </span>
        <span className={`shrink-0 text-xl sm:text-2xl font-black leading-none tabular-nums ${color}`}>
          {count}
        </span>
      </div>
    </motion.div>
  );
}

// ---------------- TYPES ----------------

interface ClubDetailPanelProps {
  clubId: number;
  onClose: () => void;
}

// ---------------- COMPONENT ----------------

function ClubDetailPanel({ clubId, onClose }: ClubDetailPanelProps) {
  const [data, setData] = useState<ClubDetalleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAbortError = (value: unknown): boolean => {
    if (value instanceof DOMException && value.name === "AbortError") return true;
    if (typeof value === "object" && value !== null) {
      const error = value as { name?: string; code?: string };
      return error.name === "CanceledError" || error.code === "ERR_CANCELED";
    }
    return false;
  };

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setLoading(true);
    setError(null);
    setData(null);

    getClubDetalle(clubId, controller.signal)
      .then((result) => { if (active) setData(result); })
      .catch((err) => {
        if (!active || isAbortError(err)) return;
        if (active) setError("No se pudo cargar el detalle del club.");
        console.error("ClubDetailPanel fetch error:", err);
      })
      .finally(() => { if (active) setLoading(false); });

    return () => {
      active = false;
      controller.abort();
    };
  }, [clubId]);

  // -------- DERIVED DATA --------

  const genderPerSport = data?.generoPorDeporte.map((d) => ({
    sport: d.deporte,
    male: d.masculino,
    female: d.femenino,
  })) ?? [];

  const rawAges = data ? edadesFrecuenciaToAges(data.edadesFrecuencia) : [];

  const infraItems = data?.conteoInfraestructura
    ? INFRA_ITEMS.filter((item) => (data.conteoInfraestructura![item.key] ?? 0) > 0)
    : [];

  // -------- RENDER --------

  return (
    <div className="panel-slide-in fixed right-0 top-0 z-[60] h-full w-full lg:w-[60vw] overflow-y-auto border-l border-border bg-card shadow-2xl">
      {/* HEADER */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          {data?.club.logoUrl ? (
            <img
              src={data.club.logoUrl}
              alt={data.club.nombre}
              className="h-10 w-10 rounded-full border border-border object-cover shrink-0"
            />
          ) : (
            <Building2 className="h-5 w-5 text-primary shrink-0" />
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground leading-tight truncate">
              {data?.club.nombre ?? "Cargando..."}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 transition-colors hover:bg-primary/30 shrink-0"
        >
          <X className="h-5 w-5 text-muted-foreground hover:text-primary" />
        </button>
      </div>

      {/* CONTENT */}
      <div className="space-y-4 p-4">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
                <span>{data.club.nombreMunicipio}, {data.club.nombreProvincia}</span>
              </div>
              {data.club.direccion && (
                <p className="pl-6 text-xs text-muted-foreground">{data.club.direccion}</p>
              )}
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3">
              <KpiCard
                title="Deportistas"
                value={data.totalDeportistas}
                icon={<Users className="h-4 w-4" />}
              />
              <KpiCard
                title="Deportes"
                value={data.totalDeportes}
                icon={<Trophy className="h-4 w-4" />}
              />
            </div>

            {/* CHARTS */}
            <div className="grid gap-3 lg:items-stretch lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
              <AthletesPerSportChart data={genderPerSport} />
              <div className="h-[220px] lg:h-full">
                <AgeDistributionChart ages={rawAges} fillHeight />
              </div>
            </div>

            {/* INFRAESTRUCTURA */}
            {infraItems.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Infraestructura del club
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {infraItems.map((item, index) => (
                    <InfraCard
                      key={item.key}
                      index={index}
                      label={item.label}
                      count={data.conteoInfraestructura![item.key]}
                      image={item.image}
                      color={item.color}
                      accentHex={item.accentHex}
                      ring={item.ring}
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

export default ClubDetailPanel;
