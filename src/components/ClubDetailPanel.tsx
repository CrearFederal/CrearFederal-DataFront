import { useMemo } from "react";
import {
  X,
  Building2,
  MapPin,
  Users,
  Trophy,
} from "lucide-react";

import type { Filters } from "../types/types";
import {
  getClub,
  getMunicipio,
  getProvincia,
  getStats,
} from "../data/dataUtils";

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

function ClubDetailPanel({
  clubId,
  filters,
  onClose,
}: ClubDetailPanelProps) {
  // -------- DATA --------
  const club = useMemo(() => getClub(clubId), [clubId]);

  const municipio = useMemo(
    () => (club ? getMunicipio(club.id_municipio) : null),
    [club]
  );

  const provincia = useMemo(
    () => (club ? getProvincia(club.id_provincia) : null),
    [club]
  );

  const stats = useMemo(() => {
    if (!club) return null;

    return getStats(filters, {
      provinciaId: club.id_provincia,
      municipioId: club.id_municipio,
      clubId: club.id_club,
    });
  }, [club, filters]);

  // -------- EMPTY STATE --------
  if (!club) {
    return (
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-card p-4">
        <p className="text-sm text-muted-foreground">
          Club no encontrado
        </p>
      </div>
    );
  }

  // -------- RENDER --------

  return (
    <div className="panel-slide-in fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-border bg-card shadow-2xl">
      {/* HEADER */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {club.logoUrl ? (
            <img
              src={club.logoUrl}
              alt={club.nombre}
              className="h-10 w-10 rounded-full border border-border object-cover"
            />
          ) : (
            <Building2 className="h-5 w-5 text-primary" />
          )}

          <h2 className="text-lg font-bold text-foreground">
            {club.nombre}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-1.5 transition-colors hover:bg-secondary"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* CONTENT */}
      <div className="space-y-4 p-4">
        {/* LOCATION */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {municipio?.nombre || "Municipio"},{" "}
          {provincia?.nombre || "Provincia"}
        </div>

        {/* KPIs */}
        {stats && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <KpiCard
                title="Atletas"
                value={stats.totalAthletes}
                icon={<Users className="h-4 w-4" />}
              />
              <KpiCard
                title="Deportes"
                value={stats.totalSports}
                icon={<Trophy className="h-4 w-4" />}
              />
            </div>

            {/* CHARTS */}
            <AthletesPerSportChart
              data={stats.athletesPerSport}
            />
            <GenderDistributionChart
              data={stats.genderDistribution}
            />
            <AgeDistributionChart
              data={stats.ageDistribution}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default ClubDetailPanel;