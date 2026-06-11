import { useEffect, useState } from "react";
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

import imgFutbol   from "../../assets/CanchaFutbol.jpg";
import imgTenis    from "../../assets/CanchaTenis.jpg";
import imgNatacion from "../../assets/CanchaNatacion.jpg";
import imgBasket   from "../../assets/CanchaBasket.jpg";
import imgVoley    from "../../assets/CanchaVoley.jpg";
import imgRugby    from "../../assets/CanchaRugby.jpg";
import imgHockey   from "../../assets/CanchaHockey.jpg";
import otros       from "../../assets/Otros.jpg";

// ---------------- INFRAESTRUCTURA ----------------

interface InfraItemConfig {
  key: keyof ConteoInfraestructura;
  label: string;
  image: string | null;
  color: string;
}

const INFRA_ITEMS: InfraItemConfig[] = [
  { key: "CanchaFutbol",   label: "CANCHAS DE FÚTBOL",    image: imgFutbol,   color: "text-green-500" },
  { key: "CanchaBasquet",  label: "CANCHAS DE BÁSQUET",   image: imgBasket,   color: "text-orange-300" },
  { key: "CanchaHockey",   label: "CANCHAS DE HOCKEY",    image: imgHockey,   color: "text-blue-400"   },
  { key: "CanchaTenis",    label: "CANCHAS DE TENIS",     image: imgTenis,    color: "text-orange-500" },
  { key: "CanchaVoley",    label: "CANCHAS DE VOLEY",     image: imgVoley,    color: "text-rose-300" },
  { key: "CanchaNatacion", label: "PILETAS DE NATACIÓN",  image: imgNatacion, color: "text-cyan-400" },
  { key: "CanchaRugby",    label: "CANCHAS DE RUGBY",     image: imgRugby,    color: "text-green-600"   },
  { key: "Otros",          label: "OTRAS INSTALACIONES",  image: otros,       color: "text-gray-400" },
];

function InfraCard({ label, count, image, color }: { label: string; count: number; image: string | null; color: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden aspect-[4/2]">
      {image ? (
        <img src={image} alt={label} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-600 to-slate-800" />
      )}
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-1.5">
        <span className={`text-3xl sm:text-4xl font-black leading-none ${color} drop-shadow-sm`}>
          {count}
        </span>
        <span className="text-[8px] sm:text-[9px] font-semibold text-white/90 text-center uppercase tracking-widest leading-tight">
          {label}
        </span>
      </div>
    </div>
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
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 p-4 backdrop-blur-sm">
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
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  <Building2 className="h-5 w-5 text-primary inline-block mr-2" />
                  Infraestructura del club
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {infraItems.map((item) => (
                    <InfraCard
                      key={item.key}
                      label={item.label}
                      count={data.conteoInfraestructura![item.key]}
                      image={item.image}
                      color={item.color}
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
