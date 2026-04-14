import { useState, useEffect, useMemo } from "react";
import type { Filters, NavigationState } from "../types/types";
import { canClickProvince, canClickMunicipio, getInitialNavigation, isNavigationAllowed } from "../data/roles";
import type { UserRoleConfig } from "../data/roles";
import { getClub, getStats, getProvinciaStats } from "../data/dataUtils";
import { getClubesTotales } from "../data/clubesApi";
import { getDeportistasTotales } from "../data/deportistasApi";
import { authBootstrap, getAuthMe, sendLogoutOnPageClose } from "../api/session";
import type { AuthScope } from "../types/auth";
import BreadcrumbNav from "../components/BreadcrumbNav";
import GlobalFilters from "../components/GlobalFilters";
import LeafletMap from "../components/LeafletMap";
import ClubDetailPanel from "../components/ClubDetailPanel";
import KpiCard from "../components/KpiCard";
import { AthletesPerSportChart, GenderDistributionChart, AgeDistributionChart, ProvinceRankingChart, GenderPerSportChart } from "../components/Charts";
import { BarChart3, Building2, Users, Medal } from "lucide-react";
import type { ClubesTotalesResponse } from "../types/Clubes";
import type { DeportistasTotalesResponse } from "../types/Deportistas";
import { getTopDeportes } from "../data/statsApi";
import type { TopDeporteItem } from "../data/statsApi";
import { getMapaProvinciasResumen } from "../data/mapaApi";
import type { ProvinciaResumen } from "../types/Mapa";
import { getProvinciasTop10 } from "../data/provinciasApi";
import type { ProvinciaRanking } from "../types/Provincias";

const mapScopeToRoleConfig = (scope: AuthScope): UserRoleConfig => {
  switch (scope.role) {
    case "coa":
      return { role: "coa" };
    case "province":
      return {
        role: "province",
        provinciaId: scope.provinciaId ?? undefined,
      };
    case "municipality":
      return {
        role: "municipality",
        provinciaId: scope.provinciaId ?? undefined,
        municipioId: scope.municipioId ?? undefined,
      };
    case "club":
      return {
        role: "club",
        clubId: scope.clubId ?? undefined,
      };
    case "federation":
      return {
        role: "federation",
        federationScope: scope.federationScope ?? undefined,
        provinciaId: scope.provinciaId ?? undefined,
        deporteId: scope.deporteId ?? undefined,
      };
    default:
      return { role: "coa" };
  }
};

// ---------------- COMPONENT ----------------

function Dashboard() {
  const [roleConfig, setRoleConfig] = useState<UserRoleConfig | null>(null);
  const [navigation, setNavigation] = useState<NavigationState>({ level: "country" });
  const [filters, setFilters] = useState<Filters>({ sports: [], gender: [], ageRange: [6, 60] });
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [clubesTotales, setClubesTotales] = useState<ClubesTotalesResponse | null>(null);
  const [deportistasTotales, setDeportistasTotales] = useState<DeportistasTotalesResponse | null>(null);
  const [authStatus, setAuthStatus] = useState<"loading" | "ready" | "error">("loading");
  const [topDeportes, setTopDeportes] = useState<TopDeporteItem[] | null>(null);
  const [provinciasResumen, setProvinciasResumen] = useState<ProvinciaResumen[] | null>(null);
  const [provinciasTop10, setProvinciasTop10] = useState<ProvinciaRanking[] | null>(null);

  const isAbortError = (error: unknown): boolean => {
    if (error instanceof DOMException && error.name === "AbortError") {
      return true;
    }

    if (typeof error === "object" && error !== null) {
      const err = error as { name?: string; code?: string };
      return err.name === "CanceledError" || err.code === "ERR_CANCELED";
    }

    return false;
  };

  useEffect(() => {
    if (!roleConfig) return;

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
    let active = true;

    const cleanupLoginParam = () => {
      const url = new URL(window.location.href);
      if (!url.searchParams.has("login")) return;

      url.searchParams.delete("login");
      const nextUrl = `${url.pathname}${url.search}${url.hash}`;
      window.history.replaceState({}, document.title, nextUrl || "/");
    };

    const initializeAuth = async () => {
      const login = new URLSearchParams(window.location.search).get("login")?.trim();

      if (login) {
        try {
          const boot = await authBootstrap(login, controller.signal);
          if (!active) return;

          setRoleConfig(mapScopeToRoleConfig(boot.scope));
          cleanupLoginParam();
          setAuthStatus("ready");
          return;
        } catch (error) {
          if (!active || isAbortError(error)) return;
          setAuthStatus("error");
          return;
        }
      }

      try {
        const me = await getAuthMe(controller.signal);
        if (!active) return;

        setRoleConfig(mapScopeToRoleConfig(me.scope));
        cleanupLoginParam();
        setAuthStatus("ready");
        return;
      } catch (error) {
        if (!active || isAbortError(error)) return;
        setAuthStatus("error");
      }
    };

    void initializeAuth();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (authStatus !== "ready") return;

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
  }, [authStatus]);

  useEffect(() => {
    if (authStatus !== "ready") return;

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
  }, [authStatus]);

  useEffect(() => {
    if (authStatus !== "ready") return;

    const handlePageHide = () => {
      sendLogoutOnPageClose();
    };

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [authStatus]);

  useEffect(() => {
    if (authStatus !== "ready") return;

    const controller = new AbortController();

    const loadTopDeportes = async () => {
      try {
        const data = await getTopDeportes(controller.signal);
        if (!controller.signal.aborted) setTopDeportes(data);
      } catch {
        if (!controller.signal.aborted) setTopDeportes(null);
      }
    };

    void loadTopDeportes();

    return () => controller.abort();
  }, [authStatus]);

  const clubForRole = useMemo(() => {
    if (roleConfig?.role === "club" && roleConfig.clubId) {
      return getClub(roleConfig.clubId);
    }

    return null;
  }, [roleConfig]);

  const scope = useMemo(
    () => ({ provinciaId: navigation.provinciaId, municipioId: navigation.municipioId }),
    [navigation]
  );

  const stats = useMemo(() => getStats(filters, scope), [filters, scope]);

  const provStats = useMemo(() => getProvinciaStats(filters), [filters]);

  useEffect(() => {
    if (authStatus !== "ready") return;
    const controller = new AbortController();

    const load = async () => {
      try {
        const data = await getMapaProvinciasResumen(filters, controller.signal);
        if (!controller.signal.aborted) setProvinciasResumen(data);
      } catch {
        if (!controller.signal.aborted) setProvinciasResumen(null);
      }
    };

    void load();
    return () => controller.abort();
  }, [authStatus, filters]);

  useEffect(() => {
    if (authStatus !== "ready") return;
    const controller = new AbortController();

    const loadProvinciasTop10 = async () => {
      try {
        const data = await getProvinciasTop10(controller.signal);
        if (!controller.signal.aborted) setProvinciasTop10(data.provincias);
      } catch {
        if (!controller.signal.aborted) setProvinciasTop10(null);
      }
    };

    void loadProvinciasTop10();
    return () => controller.abort();
  }, [authStatus]);

  const genderDistribution = useMemo(() => {
    if (!provinciasResumen) return stats.genderDistribution;
    const male   = provinciasResumen.reduce((s, p) => s + p.totalHombres, 0);
    const female = provinciasResumen.reduce((s, p) => s + p.totalMujeres, 0);
    const total  = male + female || 1;
    return {
      male,
      female,
      malePercent:   Math.round(male   * 100 / total),
      femalePercent: Math.round(female * 100 / total),
    };
  }, [provinciasResumen, stats.genderDistribution]);

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Inicializando sesión...</p>
      </div>
    );
  }

  if (authStatus === "error" || !roleConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-destructive">No se pudo inicializar la sesión.</p>
      </div>
    );
  }

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

  // -------- RENDER --------

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* MAIN */}
      <div className="flex-1 flex flex-col p-4 gap-3">
        <div className="flex items-center justify-end">
          <BreadcrumbNav navigation={navigation} onNavigate={handleNavigate} roleConfig={roleConfig} />
        </div>

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
              ? `Mas deportistas en: ${clubesTotales.clubConMasDeportistas.nombre} (${clubesTotales.clubConMasDeportistas.totalDeportistas})`
              : `Mas deportistas en: ${stats.clubWithMostAthletes} (${stats.clubWithMostAthletesCount})`}
            icon={<Building2 className="h-5 w-5" />}
          />
          <KpiCard
            title="Total de Deportistas"
            value={deportistasTotales?.deportistas ?? stats.totalAthletes}
            subtitle={deportistasTotales
              ? `${deportistasTotales.porcentaje.toLocaleString("es-AR")}% de ${deportistasTotales.provinciaLider}`
              : `En ${stats.totalSports.toLocaleString()} deportes`}
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
            value={deportistasTotales?.deporteLider ?? stats.mostPracticedSport}
            subtitle={`Con un total de ${(deportistasTotales?.cantidadDeportistas ?? stats.mostPracticedCount).toLocaleString()} deportistas`}
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
            <AthletesPerSportChart data={topDeportes ?? stats.genderPerSport} />
            <AgeDistributionChart data={stats.ageDistribution} />
          </div>
        </div>

        {/* ROW 4 — Province + Gender + Gender per Sport */}
        <div className="grid grid-cols-3 gap-3">
          <ProvinceRankingChart data={provinciasTop10 ?? []} />
          <GenderDistributionChart data={genderDistribution} />
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
