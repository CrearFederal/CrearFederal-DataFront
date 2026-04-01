import { useMemo } from "react";
import type { Filters, NavigationState } from "../types/types";
import {
  getStats,
  getProvincia,
  getMunicipio,
} from "../data/dataUtils";

import { Users, Building2, Trophy, Star } from "lucide-react";

import KpiCard from "./KpiCard";
import {
  AthletesPerSportChart,
  GenderDistributionChart,
} from "./Charts";

// ---------------- TYPES ----------------

interface SidePanelProps {
  navigation: NavigationState;
  filters: Filters;
}

// ---------------- COMPONENT ----------------

function SidePanel({ navigation, filters }: SidePanelProps) {
  // -------- SCOPE --------
  const scope = useMemo(
    () => ({
      provinciaId: navigation.provinciaId,
      municipioId: navigation.municipioId,
    }),
    [navigation]
  );

  // -------- DATA --------
  const stats = useMemo(() => getStats(filters, scope), [filters, scope]);

  // -------- LABEL --------
  const levelLabel = useMemo(() => {
    switch (navigation.level) {
      case "country":
        return "Argentina";

      case "province":
        return (
          getProvincia(navigation.provinciaId ?? 0)?.nombre ||
          "Provincia"
        );

      case "city":
        return (
          getMunicipio(navigation.municipioId ?? 0)?.nombre ||
          "Municipio"
        );

      default:
        return "";
    }
  }, [navigation]);

  const showMostPracticed = navigation.level !== "country";

  // -------- RENDER --------

  return (
    <div className="space-y-4 fade-up">
      {/* TITLE */}
      <h2 className="text-lg font-bold text-foreground">
        {levelLabel}
      </h2>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          title="Total Clubes"
          value={stats.totalClubs}
          icon={<Building2 className="h-4 w-4" />}
        />

        <KpiCard
          title="Total Atletas"
          value={stats.totalAthletes}
          icon={<Users className="h-4 w-4" />}
        />

        {showMostPracticed ? (
          <KpiCard
            title="Deporte Principal"
            value={stats.mostPracticedSport}
            icon={<Star className="h-4 w-4" />}
          />
        ) : (
          <KpiCard
            title="Deportes"
            value={stats.totalSports}
            icon={<Trophy className="h-4 w-4" />}
          />
        )}
      </div>

      {/* CHARTS */}
      <AthletesPerSportChart data={stats.athletesPerSport} />
      <GenderDistributionChart data={stats.genderDistribution} />
    </div>
  );
}

export default SidePanel;