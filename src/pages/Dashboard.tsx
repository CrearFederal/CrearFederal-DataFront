import { useState, useEffect, useMemo } from "react";
import type { Filters, NavigationState } from "../types/types";
import {canClickProvince, getInitialNavigation, isNavigationAllowed } from "../data/roles";
import type { UserRoleConfig } from "../data/roles";
import { getClub } from "../data/dataUtils";
import BreadcrumbNav from "../components/BreadcrumbNav";
import GlobalFilters from "../components/GlobalFilters";
import LeafletMap from "../components/LeafletMap";
import SidePanel from "../components/SidePanel";
import ClubDetailPanel from "../components/ClubDetailPanel";
import { BarChart3 } from "lucide-react";

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
      <div className="flex-1 flex flex-col p-4 gap-3">
        {/* Filters */}
        <GlobalFilters filters={filters} onChange={setFilters} />

        {/* Layout */}
        <div
          className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-4"
          style={{ minHeight: "70vh" }}
        >
          {/* Map */}
          <div className="lg:col-span-3 relative z-0">
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

          {/* Side panel */}
          <div
            className="lg:col-span-2 overflow-y-auto scrollbar-dark"
            style={{ maxHeight: "75vh" }}
          >
            <SidePanel navigation={navigation} filters={filters} />
          </div>
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