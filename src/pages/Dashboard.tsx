import { useState, useEffect, useMemo } from "react";
import type { Filters, NavigationState } from "../types/types";
import {canClickProvince, getInitialNavigation, isNavigationAllowed } from "../data/roles";
import type { UserRoleConfig } from "../data/roles";
import { getClub, getStats } from "../data/dataUtils";
import BreadcrumbNav from "../components/BreadcrumbNav";
import GlobalFilters from "../components/GlobalFilters";
import LeafletMap from "../components/LeafletMap";
import ClubDetailPanel from "../components/ClubDetailPanel";
import KpiCard from "../components/KpiCard";
import { AthletesPerSportChart, GenderDistributionChart } from "../components/Charts";
import { BarChart3, Building2, Users, Trophy, Zap } from "lucide-react";

const ROLE_OPTIONS: { label: string; config: UserRoleConfig }[] = [
  { label: "COA (Nacional)", config: { role: "coa" } },
  {
    label: "Provincia (Buenos Aires)",
    config: { role: "province", provinciaId: 1 },
  },
  {
    label: "Club (Club #1)",
    config: { role: "club", clubId: 1 },
  },
];

function Dashboard() {
  const [roleConfig, setRoleConfig] = useState<UserRoleConfig>({
    role: "coa",
  });

  const [navigation, setNavigation] = useState<NavigationState>({
    level: "country",
  });

  const [filters, setFilters] = useState<Filters>({
    sports: [],
    gender: [],
    ageRange: [6, 60],
  });

  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);

  useEffect(() => {
    const initialNavigation = getInitialNavigation(roleConfig);

    setNavigation(initialNavigation);
    setSelectedClubId(null);

    // Si el rol es club → auto seleccionar club
    if (roleConfig.role === "club" && roleConfig.clubId) {
      setSelectedClubId(roleConfig.clubId);
    }
  }, [roleConfig]);

  const handleProvinceClick = (provinciaId: number) => {
    if (!canClickProvince(roleConfig)) return;

    setNavigation({
      level: "province",
      provinciaId,
    });

    setSelectedClubId(null);
  };

  const handleMunicipioClick = (municipioId: number) => {
    setNavigation((prev) => ({
      level: "city",
      provinciaId: prev.provinciaId,
      municipioId,
    }));

    setSelectedClubId(null);
  };

  const handleClubClick = (clubId: number) => {
    setSelectedClubId(clubId);
  };

  const handleNavigate = (nav: NavigationState) => {
    if (!isNavigationAllowed(roleConfig, nav)) return;

    setNavigation(nav);
    setSelectedClubId(null);
  };

  const handleNavigateCountry = () => {
    if (roleConfig.role !== "coa") return;

    setNavigation({ level: "country" });
    setSelectedClubId(null);
  };

  const clubForRole = useMemo(() => {
    if (roleConfig.role === "club" && roleConfig.clubId) {
      return getClub(roleConfig.clubId);
    }
    return null;
  }, [roleConfig]);

  // -------- STATS & LABELS --------
  const scope = useMemo(
    () => ({
      provinciaId: navigation.provinciaId,
      municipioId: navigation.municipioId,
    }),
    [navigation]
  );

  const stats = useMemo(() => getStats(filters, scope), [filters, scope]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-2.5">
          {/* Left */}
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-foreground">
                Análisis Deportivo
              </h1>
              <p className="text-xs text-muted-foreground">Panel COA</p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Role selector */}
            <select
              value={ROLE_OPTIONS.findIndex(
                (opt) =>
                  opt.config.role === roleConfig.role &&
                  opt.config.provinciaId === roleConfig.provinciaId &&
                  opt.config.clubId === roleConfig.clubId
              )}
              onChange={(e) =>
                setRoleConfig(ROLE_OPTIONS[Number(e.target.value)].config)
              }
              className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {ROLE_OPTIONS.map((option, index) => (
                <option key={index} value={index}>
                  {option.label}
                </option>
              ))}
            </select>

            <BreadcrumbNav
              navigation={navigation}
              onNavigate={handleNavigate}
              roleConfig={roleConfig}
            />
          </div>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex-1 flex flex-col p-4 gap-3 bg-background">
        {/* KPIs + Filters Row */}
        <div className="flex gap-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-5 gap-2.5 flex-1">
            <KpiCard
              title="Total Clubes"
              value={stats.totalClubs}
              icon={<Building2 className="h-5 w-5" />}
            />
            <KpiCard
              title="Total Atletas"
              value={stats.totalAthletes}
              icon={<Users className="h-5 w-5" />}
            />
            <KpiCard
              title="Deportes"
              value={stats.totalSports}
              icon={<Trophy className="h-5 w-5" />}
            />
            <KpiCard
              title="Deporte Principal"
              value={`${stats.mostPracticedSport} (${stats.mostPracticedCount})`}
              icon={<Zap className="h-5 w-5" />}
            />
            <KpiCard
              title="Club Top Atletas"
              value={`${stats.clubWithMostAthletes} (${stats.clubWithMostAthletesCount})`}
              icon={<Building2 className="h-5 w-5" />}
            />
          </div>

          {/* Filters (Right) */}
          <div className="w-72">
            <GlobalFilters filters={filters} onChange={setFilters} />
          </div>
        </div>

        {/* Map + Chart Row */}
        <div className="flex gap-3 flex-1" style={{ minHeight: "50vh" }}>
          {/* Map - Left Side (70%) */}
          <div className="flex-1 relative z-0 bg-card border border-border rounded-lg overflow-hidden">
            <LeafletMap
              filters={filters}
              navigation={navigation}
              roleConfig={roleConfig}
              clubForRole={clubForRole}
              onProvinceClick={handleProvinceClick}
              onMunicipioClick={handleMunicipioClick}
              onClubClick={handleClubClick}
              onNavigateCountry={handleNavigateCountry}
            />
          </div>

          {/* Athletes Chart - Right Side (30%) */}
          <div className="w-96 bg-card border border-border rounded-lg overflow-hidden">
            <AthletesPerSportChart data={stats.athletesPerSport} />
          </div>
        </div>

        {/* Gender Distribution Chart - Full Width Below */}
        <div className="bg-card border border-border rounded-lg p-4" style={{ minHeight: "25vh" }}>
          <GenderDistributionChart data={stats.genderDistribution} />
        </div>
      </div>

      {/* CLUB MODAL */}
      {selectedClubId && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm"
            onClick={() => {
              if (roleConfig.role !== "club") {
                setSelectedClubId(null);
              }
            }}
          />

          {/* Panel */}
          <ClubDetailPanel
            clubId={selectedClubId}
            filters={filters}
            onClose={() => {
              if (roleConfig.role !== "club") {
                setSelectedClubId(null);
              }
            }}
          />
        </>
      )}
    </div>
  );
}

export default Dashboard;