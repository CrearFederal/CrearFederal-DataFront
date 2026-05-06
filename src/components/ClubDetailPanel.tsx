import { useEffect, useState } from "react";
import {
  X,
  Building2,
  MapPin,
  Users,
  Trophy,
  Loader2,
} from "lucide-react";

import type { Filters } from "../types/types";
import type { ClubDetalleResponse } from "../types/Clubes";
import { getClubDetalle } from "../data/clubesApi";
import { edadesFrecuenciaToAges } from "../data/dataUtils";

import KpiCard from "./KpiCard";
import {
  AthletesPerSportChart,
  GenderDistributionChart,
  AgeDistributionChart,
} from "./Charts";

// ---------------- TYPES ----------------

interface ClubDetailPanelProps {
  clubId: number;
  filters: Filters;
  onClose: () => void;
}

// ---------------- COMPONENT ----------------

function ClubDetailPanel({ clubId, onClose }: ClubDetailPanelProps) {
  const [data, setData] = useState<ClubDetalleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAbortError = (value: unknown): boolean => {
    if (value instanceof DOMException && value.name === "AbortError") {
      return true;
    }

    if (typeof value === "object" && value !== null) {
      const error = value as { name?: string; code?: string };
      return error.name === "CanceledError" || error.code === "ERR_CANCELED";
    }

    return false;
  };

  useEffect(() => {
    const controller = new AbortController();
    // active evita que una petición cancelada actualice el estado
    // (React StrictMode ejecuta los efectos dos veces en desarrollo)
    let active = true;

    setLoading(true);
    setError(null);
    setData(null);

    getClubDetalle(clubId, controller.signal)
      .then((result) => { if (active) setData(result); })
      .catch((err) => {
        if (!active || isAbortError(err)) {
          return;
        }

        if (active) setError("No se pudo cargar el detalle del club.");
        console.error("ClubDetailPanel fetch error:", err);
      })
      .finally(() => { if (active) setLoading(false); });

    return () => {
      active = false;
      controller.abort();
    };
  }, [clubId]);

  // -------- DERIVED DATA FOR CHARTS --------

  const genderPerSport = data?.generoPorDeporte.map((d) => ({
    sport: d.deporte,
    male: d.masculino,
    female: d.femenino,
  })) ?? [];

  const totalGenero = (data?.distribucionGenero.masculino ?? 0) + (data?.distribucionGenero.femenino ?? 0);
  const genderDistribution = {
    male: data?.distribucionGenero.masculino ?? 0,
    female: data?.distribucionGenero.femenino ?? 0,
    malePercent: totalGenero > 0 ? Math.round(((data?.distribucionGenero.masculino ?? 0) / totalGenero) * 100) : 0,
    femalePercent: totalGenero > 0 ? Math.round(((data?.distribucionGenero.femenino ?? 0) / totalGenero) * 100) : 0,
  };

  const rawAges = data ? edadesFrecuenciaToAges(data.edadesFrecuencia) : [];

  // -------- RENDER --------

  return (
    <div className="panel-slide-in fixed right-0 top-0 z-[60] h-full w-full lg:w-[60vw] overflow-y-auto border-l border-border bg-card shadow-2xl">
      {/* HEADER */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {data?.club.logoUrl ? (
            <img
              src={data.club.logoUrl}
              alt={data.club.nombre}
              className="h-10 w-10 rounded-full border border-border object-cover"
            />
          ) : (
            <Building2 className="h-5 w-5 text-primary" />
          )}
          <h2 className="text-lg font-bold text-foreground">
            {data?.club.nombre ?? "Cargando..."}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-1.5 transition-colors hover:bg-primary/30 "
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
              <AgeDistributionChart ages={rawAges} fillHeight />
            </div>
            <GenderDistributionChart data={genderDistribution} />
          </>
        )}
      </div>
    </div>
  );
}

export default ClubDetailPanel;
