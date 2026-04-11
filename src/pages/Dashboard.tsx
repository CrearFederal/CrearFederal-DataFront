import { useState, useEffect, useMemo } from "react";
import type { Filters, NavigationState } from "../types/types";
import { canClickProvince, canClickMunicipio, getInitialNavigation, isNavigationAllowed, getRoleLabel } from "../data/roles";
import type { UserRoleConfig } from "../data/roles";
import { getClub, getStats, getProvinciaStats } from "../data/dataUtils";
import { getClubesTotales } from "../data/clubesApi";
import { getDeportistasTotales } from "../data/deportistasApi";
import BreadcrumbNav from "../components/BreadcrumbNav";
import GlobalFilters from "../components/GlobalFilters";
import LeafletMap from "../components/LeafletMap";
import ClubDetailPanel from "../components/ClubDetailPanel";
import KpiCard from "../components/KpiCard";
import { AthletesPerSportChart, GenderDistributionChart, AgeDistributionChart, ProvinceRankingChart, GenderPerSportChart } from "../components/Charts";
import { BarChart3, Building2, Users, Medal } from "lucide-react";
import type { ClubesTotalesResponse } from "../types/Clubes";
import type { DeportistasTotalesResponse } from "../types/Deportistas";

// ---------------- ROLE OPTIONS ----------------

const ROLE_OPTIONS: { label: string; config: UserRoleConfig }[] = [
  { label: "COA (Nacional)",                     config: { role: "coa" } },
  { label: "Provincia (Buenos Aires)",           config: { role: "province", provinciaId: 1 } },
  { label: "Municipio (La Plata)",               config: { role: "municipality", provinciaId: 1, municipioId: 1 } },
  { label: "Federación Nacional (Fútbol)",       config: { role: "federation", federationScope: "national", deporteId: 1, federationId: 1 } },
  { label: "Federación Prov. (Básquetbol - Córdoba)", config: { role: "federation", federationScope: "provincial", provinciaId: 2, deporteId: 2, federationId: 2 } },
  { label: "Club (Club #1)",                     config: { role: "club", clubId: 1 } },
];

// ---------------- COMPONENT ----------------

function Dashboard() {
  const [roleConfig, setRoleConfig] = useState<UserRoleConfig>({ role: "coa" });
  const [navigation, setNavigation] = useState<NavigationState>({ level: "country" });
  const [filters, setFilters] = useState<Filters>({ sports: [], gender: [], ageRange: [6, 60] });
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [clubesTotales, setClubesTotales] = useState<ClubesTotalesResponse | null>(null);
  const [deportistasTotales, setDeportistasTotales] = useState<DeportistasTotalesResponse | null>(null);

  useEffect(() => {
    setNavigation(getInitialNavigation(roleConfig));
    setSelectedClubId(null);

    if (roleConfig.role === "club" && roleConfig.clubId) {
      setSelectedClubId(roleConfig.clubId);
    }
    if (roleConfig.role === "federation" && roleConfig.deporteId) {
      setFilters((prev) => ({ ...prev, sports: [roleConfig.deporteId!] }));
    } else {
      setFilters((prev) => ({ ...prev, sports: [] }));
    }
  }, [roleConfig]);

  useEffect(() => {
    const controller = new AbortController();

    const loadClubesTotales = async () => {
      try {
        const data = await getClubesTotales(controller.signal);
        if (!controller.signal.aborted) {
          setClubesTotales(data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setClubesTotales(null);
        }
      }
    };

    void loadClubesTotales();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadDeportistasTotales = async () => {
      try {
        const data = await getDeportistasTotales(controller.signal);
        if (!controller.signal.aborted) {
          setDeportistasTotales(data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setDeportistasTotales(null);
        }
      }
    };

    void loadDeportistasTotales();

    return () => controller.abort();
  }, []);

  // -------- HANDLERS --------

  const handleProvinceClick = (provinciaId: number) => {
    if (!canClickProvince(roleConfig)) return;
    setNavigation({ level: "province", provinciaId });
    setSelectedClubId(null);
  };

  const handleMunicipioClick = (municipioId: number) => {
    if (!canClickMunicipio(roleConfig)) return;
    setNavigation((prev) => ({ level: "city", provinciaId: prev.provinciaId, municipioId }));
    setSelectedClubId(null);
  };

  const handleClubClick = (clubId: number) => setSelectedClubId(clubId);

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
    if (roleConfig.role === "club" && roleConfig.clubId) return getClub(roleConfig.clubId);
    return null;
  }, [roleConfig]);

  // -------- DATA --------

  const scope = useMemo(
    () => ({ provinciaId: navigation.provinciaId, municipioId: navigation.municipioId }),
    [navigation]
  );

  const stats = useMemo(() => getStats(filters, scope), [filters, scope]);

  const provStats = useMemo(() => getProvinciaStats(filters), [filters]);

  // -------- RENDER --------

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
              <h1 className="text-lg font-bold text-foreground">Análisis Deportivo</h1>
              <p className="text-xs text-muted-foreground">{getRoleLabel(roleConfig)}</p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <select
              value={ROLE_OPTIONS.findIndex(
                (opt) =>
                  opt.config.role === roleConfig.role &&
                  opt.config.provinciaId === roleConfig.provinciaId &&
                  opt.config.clubId === roleConfig.clubId
              )}
              onChange={(e) => setRoleConfig(ROLE_OPTIONS[Number(e.target.value)].config)}
              className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {ROLE_OPTIONS.map((option, index) => (
                <option key={index} value={index}>{option.label}</option>
              ))}
            </select>

            <BreadcrumbNav navigation={navigation} onNavigate={handleNavigate} roleConfig={roleConfig} />
          </div>
        </div>
      </header>

      {/* MAIN */}
      <div className="flex-1 flex flex-col p-4 gap-3">

        {/* ROW 1 — Filters */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Filtros</h3>
          <GlobalFilters filters={filters} onChange={setFilters} />
        </div>

        {/* ROW 2 — KPIs */}
        <div className="grid grid-cols-4 gap-2.5">
          <KpiCard
            title="Total de Clubes"
            value={clubesTotales?.totalClubes ?? stats.totalClubs}
            subtitle={clubesTotales
              ? `Club con mas deportistas: ${clubesTotales.clubConMasDeportistas.nombre} (${clubesTotales.clubConMasDeportistas.totalDeportistas})`
              : `Club con mas deportistas: ${stats.clubWithMostAthletes} (${stats.clubWithMostAthletesCount})`}
            icon={<Building2 className="h-5 w-5" />}
          />
          <KpiCard
            title="Total de Atletas"
            value={deportistasTotales?.deportistas ?? stats.totalAthletes}
            subtitle={`En ${(deportistasTotales?.deportes ?? stats.totalSports).toLocaleString()} deportes`}
            icon={<Users className="h-5 w-5" />}
          />
          <KpiCard
            title="Cantidad de Deportes"
            value={deportistasTotales?.deportes ?? stats.totalSports}
            subtitle="Disciplinas con deportistas activos"
            icon={<BarChart3 className="h-5 w-5" />}
          />
          <KpiCard
            title="Deporte líder"
            value={stats.mostPracticedSport}
            subtitle={`Con un total de ${stats.mostPracticedCount.toLocaleString()} deportistas`}
            icon={<Medal className="h-5 w-5" />}
          />
        </div>

        {/* ROW 3 — Map + Charts stack */}
        <div className="flex gap-3" style={{ minHeight: "52vh" }}>

          {/* Map — 50% */}
          <div className="relative z-0 bg-card border border-border rounded-xl overflow-hidden" style={{ flex: "0 0 50%" }}>
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

          {/* Right charts — 50% stacked */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <AthletesPerSportChart data={stats.genderPerSport} />
            <GenderDistributionChart data={stats.genderDistribution} />
          </div>
        </div>

        {/* ROW 4 — Age + Province + Gender per Sport */}
        <div className="grid grid-cols-3 gap-3">
          <AgeDistributionChart data={stats.ageDistribution} />
          <ProvinceRankingChart data={provStats} />
          <GenderPerSportChart data={stats.athletesPerSport} />
        </div>

      </div>

      {/* CLUB MODAL */}
      {selectedClubId && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/50 backdrop-blur-sm"
            onClick={() => { if (roleConfig.role !== "club") setSelectedClubId(null); }}
          />
          <ClubDetailPanel
            clubId={selectedClubId}
            filters={filters}
            onClose={() => { if (roleConfig.role !== "club") setSelectedClubId(null); }}
          />
        </>
      )}
    </div>
  );
}

export default Dashboard;
