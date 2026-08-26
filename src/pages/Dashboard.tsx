import { useState, useEffect, useMemo, useRef, useCallback, startTransition } from "react";
import type { Filters, NavigationState } from "../types/types";
import { canClickProvince, canClickMunicipio, getInitialNavigation } from "../data/roles";
import type { UserRoleConfig } from "../data/roles";
import { edadesFrecuenciaToAges } from "../data/dataUtils";
import { getClubesTotales } from "../data/clubesApi";
import { getDeportistasGeneros, getDeportistasTotales, getDeportistasEdadesPorGenero } from "../data/deportistasApi";
import { authBootstrap, getAuthMe, sendLogoutOnPageClose } from "../api/session";
import type { AuthScope } from "../types/auth";
import LeafletMap from "../components/LeafletMap";
import ClubDetailPanel from "../components/ClubDetailPanel";
import PolideportivoDetailPanel from "../components/PolideportivoDetailPanel";
import FederacionDetailPanel from "../components/FederacionDetailPanel";
import KpiCard from "../components/KpiCard";
import DeporteHeatMap from "../components/DeporteHeatMap";
import { AthletesPerSportChart, GenderDistributionChart, AgeDistributionChart, ProvinceRankingChart, MunicipioRankingChart, ClubRankingChart, DeporteCoverageChart, GenderBalanceByDeportChart } from "../components/Charts";
import { BarChart3, Building2, Users, Medal, MapPin, X, Venus, Mars, TrendingUp, Volleyball } from "lucide-react";
import type { ClubesTotalesResponse } from "../types/Clubes";
import type { DeportistasGenerosResponse, DeportistasTotalesResponse } from "../types/Deportistas";
import { getTopDeportes, getTopDeportesTop10, getEdadesHistograma, getDeportesAll, getDeporteProvincias } from "../data/statsApi";
import type { TopDeporteItem, DeporteItem, DeporteProvinciasResponse } from "../data/statsApi";
import { getMapaClubes } from "../data/mapaApi";
import { getMunicipiosTop10 } from "../data/municipiosApi";
import { getProvinciasTop10 } from "../data/provinciasApi";
import { getTopClubes, getTopClubesDetalle } from "../data/clubesApi";
import type { MunicipiosTop10ContextoResponse } from "../types/Municipios";
import type { ProvinciasTop10ContextoResponse, ProvinciaRanking } from "../types/Provincias";
import { POBLACION_PROVINCIAS } from "../data/argentinaPopulation";
import type { TopClubRankingItem, TopClubesDetalleResponse } from "../types/Clubes";
import type { Club } from "../types/types";

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
  const TOTAL_CLUBES_MODAL_ANIMATION_MS = 760;
  const TOTAL_CLUBES_HEADER_DELAY_MS = 120;
  const TOTAL_CLUBES_DETAIL_DELAY_MS = 280;
  const TOTAL_CLUBES_SUBTITLE_DELAY_MS = 460;
  const TOTAL_CLUBES_CHART_DELAY_MS = 640;
  const TOTAL_DEPORTISTAS_MODAL_ANIMATION_MS = 760;
  const TOTAL_DEPORTISTAS_HEADER_DELAY_MS = 120;
  const TOTAL_DEPORTISTAS_DETAIL_DELAY_MS = 280;
  const TOTAL_DEPORTISTAS_SUBTITLE_DELAY_MS = 460;
  const TOTAL_DEPORTISTAS_CHART_DELAY_MS = 820;
  const DEPORTES_MODAL_ANIMATION_MS = 760;
  const DEPORTES_HEADER_DELAY_MS = 120;
  const DEPORTES_DETAIL_DELAY_MS = 280;
  const DEPORTES_SUBTITLE_DELAY_MS = 460;
  const DEPORTES_CHART_DELAY_MS = 640;
  const DEPORTE_LIDER_MODAL_ANIMATION_MS = 760;
  const DEPORTE_LIDER_HEADER_DELAY_MS = 120;
  const DEPORTE_LIDER_DETAIL_DELAY_MS = 280;
  const DEPORTE_LIDER_CHART_DELAY_MS = 460;
  const DEPORTE_HEATMAP_MODAL_ANIMATION_MS = 760;
  const DEPORTE_HEATMAP_HEADER_DELAY_MS = 120;
  const DEPORTE_HEATMAP_DETAIL_DELAY_MS = 280;
  const DEPORTE_HEATMAP_MAP_DELAY_MS = 460;
  const PROVINCIA_RANKING_MODAL_ANIMATION_MS = 760;
  const PROVINCIA_RANKING_HEADER_DELAY_MS = 120;
  const PROVINCIA_RANKING_DETAIL_DELAY_MS = 280;
  const [roleConfig, setRoleConfig] = useState<UserRoleConfig | null>(null);
  const [navigation, setNavigation] = useState<NavigationState>({ level: "country" });
  const [filters, setFilters] = useState<Filters>({ sports: [], gender: [], ageRange: [6, 60] });
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [selectedInfraId, setSelectedInfraId] = useState<number | null>(null);
  const [selectedFederacionId, setSelectedFederacionId] = useState<number | null>(null);
  const [clubesTotales, setClubesTotales] = useState<ClubesTotalesResponse | null>(null);
  const [deportistasTotales, setDeportistasTotales] = useState<DeportistasTotalesResponse | null>(null);
  const [deportistasGeneros, setDeportistasGeneros] = useState<DeportistasGenerosResponse | null>(null);
  const [authStatus, setAuthStatus] = useState<"loading" | "ready" | "error">("loading");
  const [topDeportes, setTopDeportes] = useState<TopDeporteItem[] | null>(null);
  const [topDeportesTop10, setTopDeportesTop10] = useState<TopDeporteItem[] | null>(null);
  const [provinciasTop10, setProvinciasTop10] = useState<ProvinciasTop10ContextoResponse | null>(null);
  const [municipiosTop10, setMunicipiosTop10] = useState<MunicipiosTop10ContextoResponse | null>(null);
  const [topClubes, setTopClubes] = useState<TopClubRankingItem[] | null>(null);
  const [topClubesDetalle, setTopClubesDetalle] = useState<TopClubesDetalleResponse | null>(null);
  const [edadesApiData, setEdadesApiData] = useState<number[] | null>(null);
  const [clubForRole, setClubForRole] = useState<Club | null>(null);
  const [deportesAll, setDeportesAll] = useState<DeporteItem[] | null>(null);
  const [selectedDeporteId, setSelectedDeporteId] = useState<number | null>(null);
  const [deporteProvincias, setDeporteProvincias] = useState<DeporteProvinciasResponse | null>(null);
  const [deporteProvinciasLoading, setDeporteProvinciasLoading] = useState(false);
  const [isTotalClubesRendered, setIsTotalClubesRendered] = useState(false);
  const [isTotalClubesVisible, setIsTotalClubesVisible] = useState(false);
  const [totalClubesContentStage, setTotalClubesContentStage] = useState(0);
  const [totalClubesModalOrigin, setTotalClubesModalOrigin] = useState<DOMRect | null>(null);
  const [isTotalDeportistasRendered, setIsTotalDeportistasRendered] = useState(false);
  const [isTotalDeportistasVisible, setIsTotalDeportistasVisible] = useState(false);
  const [totalDeportistasContentStage, setTotalDeportistasContentStage] = useState(0);
  const [totalDeportistasModalOrigin, setTotalDeportistasModalOrigin] = useState<DOMRect | null>(null);
  const [selectedGeneroDetalle, setSelectedGeneroDetalle] = useState<"femenino" | "masculino">("femenino");
  const [genderSplitAnimated, setGenderSplitAnimated] = useState(false);
  const [deporteLiderBarsAnimated, setDeporteLiderBarsAnimated] = useState(false);
  const [edadesFemenino, setEdadesFemenino] = useState<number[] | null>(null);
  const [edadesMasculino, setEdadesMasculino] = useState<number[] | null>(null);
  const [isDeportesRendered, setIsDeportesRendered] = useState(false);
  const [isDeportesVisible, setIsDeportesVisible] = useState(false);
  const [deportesContentStage, setDeportesContentStage] = useState(0);
  const [deportesModalOrigin, setDeportesModalOrigin] = useState<DOMRect | null>(null);
  const [isDeporteLiderRendered, setIsDeporteLiderRendered] = useState(false);
  const [isDeporteLiderVisible, setIsDeporteLiderVisible] = useState(false);
  const [deporteLiderContentStage, setDeporteLiderContentStage] = useState(0);
  const [deporteLiderModalOrigin, setDeporteLiderModalOrigin] = useState<DOMRect | null>(null);
  const [isDeporteHeatmapRendered, setIsDeporteHeatmapRendered] = useState(false);
  const [isDeporteHeatmapVisible, setIsDeporteHeatmapVisible] = useState(false);
  const [deporteHeatmapContentStage, setDeporteHeatmapContentStage] = useState(0);
  const [deporteHeatmapModalOrigin, setDeporteHeatmapModalOrigin] = useState<DOMRect | null>(null);
  const [selectedProvinciaRanking, setSelectedProvinciaRanking] = useState<ProvinciaRanking | null>(null);
  const [isProvinciaRankingRendered, setIsProvinciaRankingRendered] = useState(false);
  const [isProvinciaRankingVisible, setIsProvinciaRankingVisible] = useState(false);
  const [provinciaRankingContentStage, setProvinciaRankingContentStage] = useState(0);
  const totalClubesCloseTimerRef = useRef<number | null>(null);
  const totalClubesStageTimersRef = useRef<number[]>([]);
  const totalDeportistasCloseTimerRef = useRef<number | null>(null);
  const totalDeportistasStageTimersRef = useRef<number[]>([]);
  const deportesCloseTimerRef = useRef<number | null>(null);
  const deportesStageTimersRef = useRef<number[]>([]);
  const deporteLiderCloseTimerRef = useRef<number | null>(null);
  const deporteLiderStageTimersRef = useRef<number[]>([]);
  const deporteHeatmapCloseTimerRef = useRef<number | null>(null);
  const deporteHeatmapStageTimersRef = useRef<number[]>([]);
  const provinciaRankingCloseTimerRef = useRef<number | null>(null);
  const provinciaRankingStageTimersRef = useRef<number[]>([]);
  const deporteProvinciasAbortRef = useRef<AbortController | null>(null);

  const getTotalClubesModalTarget = () => {
    if (typeof window === "undefined") return null;

    const width = Math.min(1120, window.innerWidth - 32);
    const height = Math.min(620, window.innerHeight - 32);
    const left = Math.round((window.innerWidth - width) / 2);
    const top = Math.round((window.innerHeight - height) / 2);

    return { left, top, width, height };
  };

  const openTotalClubesModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (totalClubesCloseTimerRef.current !== null) {
      window.clearTimeout(totalClubesCloseTimerRef.current);
      totalClubesCloseTimerRef.current = null;
    }

    totalClubesStageTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    totalClubesStageTimersRef.current = [];

    setTotalClubesModalOrigin(event.currentTarget.getBoundingClientRect());
    setIsTotalClubesRendered(true);
    setTotalClubesContentStage(0);
    window.requestAnimationFrame(() => setIsTotalClubesVisible(true));

    totalClubesStageTimersRef.current.push(
      window.setTimeout(() => setTotalClubesContentStage(1), TOTAL_CLUBES_HEADER_DELAY_MS)
    );
    totalClubesStageTimersRef.current.push(
      window.setTimeout(() => setTotalClubesContentStage(2), TOTAL_CLUBES_DETAIL_DELAY_MS)
    );
    totalClubesStageTimersRef.current.push(
      window.setTimeout(() => setTotalClubesContentStage(3), TOTAL_CLUBES_SUBTITLE_DELAY_MS)
    );
    totalClubesStageTimersRef.current.push(
      window.setTimeout(() => setTotalClubesContentStage(4), TOTAL_CLUBES_CHART_DELAY_MS)
    );
  };

  const openTotalDeportistasModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (totalDeportistasCloseTimerRef.current !== null) {
      window.clearTimeout(totalDeportistasCloseTimerRef.current);
      totalDeportistasCloseTimerRef.current = null;
    }

    totalDeportistasStageTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    totalDeportistasStageTimersRef.current = [];

    setSelectedGeneroDetalle("femenino");
    setGenderSplitAnimated(false);
    setTotalDeportistasModalOrigin(event.currentTarget.getBoundingClientRect());
    setIsTotalDeportistasRendered(true);
    setTotalDeportistasContentStage(0);
    window.requestAnimationFrame(() => setIsTotalDeportistasVisible(true));

    if (!edadesFemenino || edadesFemenino.length === 0) {
      void handleGenderSelect("femenino");
    }

    totalDeportistasStageTimersRef.current.push(
      window.setTimeout(() => setTotalDeportistasContentStage(1), TOTAL_DEPORTISTAS_HEADER_DELAY_MS)
    );
    totalDeportistasStageTimersRef.current.push(
      window.setTimeout(() => setTotalDeportistasContentStage(2), TOTAL_DEPORTISTAS_DETAIL_DELAY_MS)
    );
    totalDeportistasStageTimersRef.current.push(
      window.setTimeout(() => setTotalDeportistasContentStage(3), TOTAL_DEPORTISTAS_SUBTITLE_DELAY_MS)
    );
    totalDeportistasStageTimersRef.current.push(
      window.setTimeout(() => setTotalDeportistasContentStage(4), TOTAL_DEPORTISTAS_CHART_DELAY_MS)
    );
  };

  const closeTotalClubesModal = () => {
    setIsTotalClubesVisible(false);
    setTotalClubesContentStage(0);

    totalClubesStageTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    totalClubesStageTimersRef.current = [];

    if (totalClubesCloseTimerRef.current !== null) {
      window.clearTimeout(totalClubesCloseTimerRef.current);
    }

    totalClubesCloseTimerRef.current = window.setTimeout(() => {
      setIsTotalClubesRendered(false);
      setTotalClubesModalOrigin(null);
      totalClubesCloseTimerRef.current = null;
    }, TOTAL_CLUBES_MODAL_ANIMATION_MS);
  };

  const closeTotalDeportistasModal = () => {
    setIsTotalDeportistasVisible(false);
    setTotalDeportistasContentStage(0);
    setGenderSplitAnimated(false);

    totalDeportistasStageTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    totalDeportistasStageTimersRef.current = [];

    if (totalDeportistasCloseTimerRef.current !== null) {
      window.clearTimeout(totalDeportistasCloseTimerRef.current);
    }

    totalDeportistasCloseTimerRef.current = window.setTimeout(() => {
      setIsTotalDeportistasRendered(false);
      setTotalDeportistasModalOrigin(null);
      totalDeportistasCloseTimerRef.current = null;
    }, TOTAL_DEPORTISTAS_MODAL_ANIMATION_MS);
  };

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
    const anyModalOpen = isDeportesVisible || isDeporteLiderVisible || isProvinciaRankingVisible;
    document.body.style.overflow = anyModalOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isDeportesVisible, isDeporteLiderVisible, isProvinciaRankingVisible]);

  useEffect(() => {
    if (!roleConfig) return;

    setNavigation(getInitialNavigation(roleConfig));
    setSelectedClubId(null);
    setSelectedInfraId(null);

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

    const loadDeportistasGeneros = async () => {
      try {
        const data = await getDeportistasGeneros(controller.signal);
        if (!controller.signal.aborted) {
          setDeportistasGeneros(data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setDeportistasGeneros(null);
        }
      }
    };

    void loadDeportistasGeneros();

    return () => controller.abort();
  }, [authStatus]);

  useEffect(() => {
    if (authStatus !== "ready") return;

    const controller = new AbortController();

    const loadTopClubesDetalle = async () => {
      try {
        const data = await getTopClubesDetalle(controller.signal);
        if (!controller.signal.aborted) setTopClubesDetalle(data);
      } catch {
        if (!controller.signal.aborted) setTopClubesDetalle(null);
      }
    };

    void loadTopClubesDetalle();

    return () => controller.abort();
  }, [authStatus]);

  useEffect(() => {
    return () => {
      if (totalClubesCloseTimerRef.current !== null) {
        window.clearTimeout(totalClubesCloseTimerRef.current);
      }
      totalClubesStageTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));

      if (totalDeportistasCloseTimerRef.current !== null) {
        window.clearTimeout(totalDeportistasCloseTimerRef.current);
      }
      totalDeportistasStageTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));

      if (deporteProvinciasAbortRef.current) {
        deporteProvinciasAbortRef.current.abort();
      }

      if (deporteHeatmapCloseTimerRef.current !== null) {
        window.clearTimeout(deporteHeatmapCloseTimerRef.current);
      }
      deporteHeatmapStageTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const modalOpen = isTotalClubesRendered || isTotalDeportistasRendered || isDeporteHeatmapRendered || selectedClubId !== null;
    if (!modalOpen) return;

    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : previousPaddingRight;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [isTotalClubesRendered, isTotalDeportistasRendered, isDeporteHeatmapRendered, selectedClubId]);

  useEffect(() => {
    if (!isTotalDeportistasRendered || totalDeportistasContentStage < 4) {
      setGenderSplitAnimated(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => setGenderSplitAnimated(true));
    return () => window.cancelAnimationFrame(frame);
  }, [isTotalDeportistasRendered, totalDeportistasContentStage]);

  useEffect(() => {
    if (!isDeporteLiderRendered || deporteLiderContentStage < 3) {
      setDeporteLiderBarsAnimated(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => setDeporteLiderBarsAnimated(true));
    return () => window.cancelAnimationFrame(frame);
  }, [isDeporteLiderRendered, deporteLiderContentStage]);

  useEffect(() => {
    if (authStatus !== "ready") return;

    if (roleConfig?.role !== "municipality") {
      setMunicipiosTop10(null);
      return;
    }

    const controller = new AbortController();

    const loadTopMunicipios = async () => {
      try {
        const data = await getMunicipiosTop10(controller.signal);
        if (!controller.signal.aborted) setMunicipiosTop10(data);
      } catch {
        if (!controller.signal.aborted) setMunicipiosTop10(null);
      }
    };

    void loadTopMunicipios();

    return () => controller.abort();
  }, [authStatus, roleConfig?.role]);

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

  useEffect(() => {
    if (authStatus !== "ready") return;

    const controller = new AbortController();

    const loadTopDeportesTop10 = async () => {
      try {
        const data = await getTopDeportesTop10(controller.signal);
        if (!controller.signal.aborted) setTopDeportesTop10(data);
      } catch {
        if (!controller.signal.aborted) setTopDeportesTop10(null);
      }
    };

    void loadTopDeportesTop10();

    return () => controller.abort();
  }, [authStatus]);

  useEffect(() => {
    if (authStatus !== "ready") return;

    if (roleConfig?.role !== "club" || !roleConfig.clubId) {
      setClubForRole(null);
      return;
    }

    const controller = new AbortController();

    const loadClubForRole = async () => {
      try {
        const clubs = await getMapaClubes({ sports: [], gender: [], ageRange: [6, 60] }, controller.signal);
        if (!controller.signal.aborted) {
          setClubForRole(clubs.find((club) => club.id_club === roleConfig.clubId) ?? null);
        }
      } catch {
        if (!controller.signal.aborted) setClubForRole(null);
      }
    };

    void loadClubForRole();

    return () => controller.abort();
  }, [authStatus, roleConfig]);

  useEffect(() => {
    if (authStatus !== "ready") return;

    const controller = new AbortController();

    const loadTopProvincias = async () => {
      try {
        const data = await getProvinciasTop10(controller.signal);
        if (!controller.signal.aborted) setProvinciasTop10(data);
      } catch {
        if (!controller.signal.aborted) setProvinciasTop10(null);
      }
    };

    void loadTopProvincias();

    return () => controller.abort();
  }, [authStatus]);

  useEffect(() => {
    if (authStatus !== "ready") return;

    const controller = new AbortController();

    const loadTopClubes = async () => {
      try {
        const data = await getTopClubes(controller.signal);
        if (!controller.signal.aborted) setTopClubes(data);
      } catch {
        if (!controller.signal.aborted) setTopClubes(null);
      }
    };

    void loadTopClubes();

    return () => controller.abort();
  }, [authStatus]);

  useEffect(() => {
    if (authStatus !== "ready") return;

    const controller = new AbortController();

    const loadEdades = async () => {
      try {
        const data = await getEdadesHistograma(controller.signal);
        if (!controller.signal.aborted) {
          const ages = edadesFrecuenciaToAges(data.edadesFrecuencia);
          setEdadesApiData(ages);
        }
      } catch {
        if (!controller.signal.aborted) setEdadesApiData(null);
      }
    };

    void loadEdades();

    return () => controller.abort();
  }, [authStatus]);


  useEffect(() => {
    if (authStatus !== "ready") return;

    const controller = new AbortController();

    const loadDeportesAll = async () => {
      try {
        const data = await getDeportesAll(controller.signal);
        if (!controller.signal.aborted) setDeportesAll(data);
      } catch {
        if (!controller.signal.aborted) setDeportesAll(null);
      }
    };

    void loadDeportesAll();

    return () => controller.abort();
  }, [authStatus]);

  const handleDeporteClick = useCallback((id: number) => {
    if (deporteProvinciasAbortRef.current) {
      deporteProvinciasAbortRef.current.abort();
    }

    const controller = new AbortController();
    deporteProvinciasAbortRef.current = controller;

    setSelectedDeporteId(id);
    setDeporteProvincias(null);
    setDeporteProvinciasLoading(true);

    getDeporteProvincias(id, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setDeporteProvincias(data);
          setDeporteProvinciasLoading(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setDeporteProvincias(null);
          setDeporteProvinciasLoading(false);
        }
      });
  }, []);

  const genderDistribution = useMemo(() => {
    if (!deportistasGeneros) {
      return { male: 0, female: 0, malePercent: 0, femalePercent: 0 };
    }

    return {
      male: deportistasGeneros.masculino,
      female: deportistasGeneros.femenino,
      malePercent: deportistasGeneros.porcentajeM,
      femalePercent: deportistasGeneros.porcentajeF,
    };
  }, [deportistasGeneros]);

  const topClubesChartData = useMemo(
    () =>
      topClubesDetalle?.clubes.map((club) => ({
        id_club: club.id_club,
        nombre: club.nombreCorto,
        nombre_corto: club.nombreCorto,
        nombreProvincia: club.nombreProvincia,
        nombreMunicipio: club.nombreMunicipio,
        totalDeportistas: club.cantidadDeportista,
      })) ?? topClubes ?? [],
    [topClubesDetalle, topClubes]
  );

  const topProvinciasDeportistas = useMemo(
    () =>
      [
        {
          nombre: deportistasTotales?.provinciaLider,
          porcentaje: deportistasTotales?.porcentaje,
        },
        {
          nombre: deportistasTotales?.provinciaLider2,
          porcentaje: deportistasTotales?.porcentaje2,
        },
        {
          nombre: deportistasTotales?.provinciaLider3,
          porcentaje: deportistasTotales?.porcentaje3,
        },
      ].filter(
        (item): item is { nombre: string; porcentaje: number } =>
          Boolean(item.nombre) && typeof item.porcentaje === "number"
      ),
    [deportistasTotales]
  );

  const deportesInsights = useMemo(() => {
    if (!topDeportes?.length) return null;
    const withPct = topDeportes.map((d) => ({
      ...d,
      total: d.male + d.female,
      pctF: d.male + d.female > 0 ? Math.round((d.female / (d.male + d.female)) * 100) : 0,
      pctM: d.male + d.female > 0 ? Math.round((d.male / (d.male + d.female)) * 100) : 0,
    }));
    return {
      masFemenino: [...withPct].sort((a, b) => b.pctF - a.pctF)[0],
      masMasculino: [...withPct].sort((a, b) => b.pctM - a.pctM)[0],
    };
  }, [topDeportes]);

  const deporteLiderStats = useMemo(() => {
    if (!deportistasTotales?.deporteLider || !topDeportes?.length) return null;
    const lider = topDeportes.find(
      (d) => d.sport.toLowerCase() === deportistasTotales.deporteLider.toLowerCase()
    ) ?? topDeportes[0];
    const segundo = topDeportes.find((d) => d !== lider);
    const total = lider.male + lider.female;
    const pctF = total > 0 ? Math.round((lider.female / total) * 100) : 0;
    const pctM = total > 0 ? Math.round((lider.male / total) * 100) : 0;
    const pctDelTotal =
      deportistasTotales.deportistas > 0
        ? Math.round((deportistasTotales.cantidadDeportistas / deportistasTotales.deportistas) * 100)
        : 0;
    return { lider, segundo, pctF, pctM, pctDelTotal };
  }, [deportistasTotales, topDeportes]);

  const provinciaRankingStats = useMemo(() => {
    if (!selectedProvinciaRanking || !provinciasTop10?.provincias.length) return null;
    const todas = provinciasTop10.provincias;
    const totalNacional = todas.reduce((acc, p) => acc + p.totalAthletes, 0);
    const pctNacional =
      totalNacional > 0
        ? parseFloat(((selectedProvinciaRanking.totalAthletes / totalNacional) * 100).toFixed(1))
        : 0;
    const poblacion = POBLACION_PROVINCIAS[selectedProvinciaRanking.id] ?? null;
    const pctPoblacion =
      poblacion && poblacion > 0
        ? parseFloat(((selectedProvinciaRanking.totalAthletes / poblacion) * 100).toFixed(2))
        : null;
    const rankingPorPoblacion = poblacion
      ? [...todas]
          .filter((p) => POBLACION_PROVINCIAS[p.id])
          .map((p) => ({
            id: p.id,
            pct: parseFloat(((p.totalAthletes / POBLACION_PROVINCIAS[p.id]) * 100).toFixed(2)),
          }))
          .sort((a, b) => b.pct - a.pct)
          .findIndex((p) => p.id === selectedProvinciaRanking.id) + 1
      : null;
    const pctF =
      selectedProvinciaRanking.totalAthletes > 0
        ? Math.round((selectedProvinciaRanking.totalMujeres / selectedProvinciaRanking.totalAthletes) * 100)
        : 0;
    const pctM =
      selectedProvinciaRanking.totalAthletes > 0
        ? Math.round((selectedProvinciaRanking.totalHombres / selectedProvinciaRanking.totalAthletes) * 100)
        : 0;
    return { pctNacional, poblacion, pctPoblacion, rankingPorPoblacion, pctF, pctM };
  }, [selectedProvinciaRanking, provinciasTop10]);

  const getAgeRangeFromAverage = (average: number | undefined) => {
    if (typeof average !== "number" || !Number.isFinite(average) || average <= 0) return null;
    const center = Math.round(average);
    return {
      from: Math.max(6, center - 3),
      to: center + 3,
    };
  };

  const femalePercent = Math.max(0, Math.min(100, deportistasGeneros?.porcentajeF ?? 0));
  const malePercent = Math.max(0, Math.min(100, deportistasGeneros?.porcentajeM ?? 0));
  const ageRangeF = getAgeRangeFromAverage(deportistasGeneros?.edadPromedioF);
  const ageRangeM = getAgeRangeFromAverage(deportistasGeneros?.edadPromedioM);
  const genderDetail = selectedGeneroDetalle === "femenino"
    ? {
      label: "femeninos",
      edad: ageRangeF,
      averageAge: deportistasGeneros?.edadPromedioF,
      deporte: deportistasGeneros?.deporteLiderF,
      accent: "text-pink-600",
      bg: "bg-pink-50",
      border: "border-pink-200",
    }
    : {
      label: "masculinos",
      edad: ageRangeM,
      averageAge: deportistasGeneros?.edadPromedioM,
      deporte: deportistasGeneros?.deporteLiderM,
      accent: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
    };

  const handleProvinceClick = useCallback((provinciaId: number) => {
    if (!roleConfig || !canClickProvince(roleConfig)) return;
    startTransition(() => {
      setNavigation({ level: "province", provinciaId });
      setSelectedClubId(null);
      setSelectedInfraId(null);
      setSelectedFederacionId(null);
    });
  }, [roleConfig]);

  const handleMunicipioClick = useCallback((municipioId: number) => {
    if (!roleConfig || !canClickMunicipio(roleConfig)) return;
    setNavigation((prev) => ({ level: "city", provinciaId: prev.provinciaId, municipioId }));
    setSelectedClubId(null);
    setSelectedInfraId(null);
    setSelectedFederacionId(null);
  }, [roleConfig]);

  const handleClubClick = useCallback((clubId: number) => setSelectedClubId(clubId), []);
  const handlePolideportivoClick = useCallback((id: number) => setSelectedInfraId(id), []);
  const handleConvenioClick = useCallback((id: number) => setSelectedInfraId(id), []);
  const handleGimnasioClick = useCallback((id: number) => setSelectedInfraId(id), []);
  const handleFederacionClick = useCallback((id: number) => setSelectedFederacionId(id), []);

  const handleNavigateCountry = useCallback(() => {
    if (!roleConfig || roleConfig.role !== "coa") return;
    setNavigation({ level: "country" });
    setSelectedClubId(null);
    setSelectedInfraId(null);
    setSelectedFederacionId(null);
  }, [roleConfig?.role]);

  const handleGenderSelect = useCallback(
    async (genero: "femenino" | "masculino") => {
      setSelectedGeneroDetalle(genero);
      
      // Check if we already have the ages loaded for this gender
      const existingEdades = genero === "femenino" ? edadesFemenino : edadesMasculino;
      if (existingEdades && existingEdades.length > 0) {
        return;
      }

      try {
        const ages = await getDeportistasEdadesPorGenero(genero);
        if (genero === "femenino") {
          setEdadesFemenino(ages);
        } else {
          setEdadesMasculino(ages);
        }
      } catch (error) {
        console.error(`Error loading ages for ${genero}:`, error);
      }
    },
    [edadesFemenino, edadesMasculino]
  );

  const getModalTarget = () => {
    if (typeof window === "undefined") return null;
    const width = Math.min(1120, window.innerWidth - 32);
    const height = Math.min(620, window.innerHeight - 32);
    const left = Math.round((window.innerWidth - width) / 2);
    const top = Math.round((window.innerHeight - height) / 2);
    return { left, top, width, height };
  };

  const getHeatmapModalTarget = () => {
    if (typeof window === "undefined") return null;
    const width = Math.min(1180, window.innerWidth - 32);
    const height = Math.min(760, window.innerHeight - 32);
    const left = Math.round((window.innerWidth - width) / 2);
    const top = Math.round((window.innerHeight - height) / 2);
    return { left, top, width, height };
  };

  const openDeportesModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (deportesCloseTimerRef.current !== null) {
      window.clearTimeout(deportesCloseTimerRef.current);
      deportesCloseTimerRef.current = null;
    }
    deportesStageTimersRef.current.forEach((t) => window.clearTimeout(t));
    deportesStageTimersRef.current = [];
    setDeportesModalOrigin(event.currentTarget.getBoundingClientRect());
    setIsDeportesRendered(true);
    setDeportesContentStage(0);
    window.requestAnimationFrame(() => setIsDeportesVisible(true));
    deportesStageTimersRef.current.push(window.setTimeout(() => setDeportesContentStage(1), DEPORTES_HEADER_DELAY_MS));
    deportesStageTimersRef.current.push(window.setTimeout(() => setDeportesContentStage(2), DEPORTES_DETAIL_DELAY_MS));
    deportesStageTimersRef.current.push(window.setTimeout(() => setDeportesContentStage(3), DEPORTES_SUBTITLE_DELAY_MS));
    deportesStageTimersRef.current.push(window.setTimeout(() => setDeportesContentStage(4), DEPORTES_CHART_DELAY_MS));
  };

  const closeDeportesModal = () => {
    setIsDeportesVisible(false);
    setDeportesContentStage(0);
    deportesStageTimersRef.current.forEach((t) => window.clearTimeout(t));
    deportesStageTimersRef.current = [];
    if (deportesCloseTimerRef.current !== null) window.clearTimeout(deportesCloseTimerRef.current);
    deportesCloseTimerRef.current = window.setTimeout(() => {
      setIsDeportesRendered(false);
      setDeportesModalOrigin(null);
      deportesCloseTimerRef.current = null;
    }, DEPORTES_MODAL_ANIMATION_MS);
  };

  const openDeporteLiderModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (deporteLiderCloseTimerRef.current !== null) {
      window.clearTimeout(deporteLiderCloseTimerRef.current);
      deporteLiderCloseTimerRef.current = null;
    }
    deporteLiderStageTimersRef.current.forEach((t) => window.clearTimeout(t));
    deporteLiderStageTimersRef.current = [];
    setDeporteLiderBarsAnimated(false);
    setDeporteLiderModalOrigin(event.currentTarget.getBoundingClientRect());
    setIsDeporteLiderRendered(true);
    setDeporteLiderContentStage(0);
    window.requestAnimationFrame(() => setIsDeporteLiderVisible(true));
    deporteLiderStageTimersRef.current.push(window.setTimeout(() => setDeporteLiderContentStage(1), DEPORTE_LIDER_HEADER_DELAY_MS));
    deporteLiderStageTimersRef.current.push(window.setTimeout(() => setDeporteLiderContentStage(2), DEPORTE_LIDER_DETAIL_DELAY_MS));
    deporteLiderStageTimersRef.current.push(window.setTimeout(() => setDeporteLiderContentStage(3), DEPORTE_LIDER_CHART_DELAY_MS));
  };

  const openDeporteHeatmapModal = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (deporteHeatmapCloseTimerRef.current !== null) {
      window.clearTimeout(deporteHeatmapCloseTimerRef.current);
      deporteHeatmapCloseTimerRef.current = null;
    }

    deporteHeatmapStageTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    deporteHeatmapStageTimersRef.current = [];

    setDeporteHeatmapModalOrigin(event.currentTarget.getBoundingClientRect());
    setIsDeporteHeatmapRendered(true);
    setDeporteHeatmapContentStage(0);
    window.requestAnimationFrame(() => setIsDeporteHeatmapVisible(true));

    deporteHeatmapStageTimersRef.current.push(
      window.setTimeout(() => setDeporteHeatmapContentStage(1), DEPORTE_HEATMAP_HEADER_DELAY_MS)
    );
    deporteHeatmapStageTimersRef.current.push(
      window.setTimeout(() => setDeporteHeatmapContentStage(2), DEPORTE_HEATMAP_DETAIL_DELAY_MS)
    );
    deporteHeatmapStageTimersRef.current.push(
      window.setTimeout(() => setDeporteHeatmapContentStage(3), DEPORTE_HEATMAP_MAP_DELAY_MS)
    );
  };

  const closeDeporteLiderModal = () => {
    setIsDeporteLiderVisible(false);
    setDeporteLiderContentStage(0);
    setDeporteLiderBarsAnimated(false);
    deporteLiderStageTimersRef.current.forEach((t) => window.clearTimeout(t));
    deporteLiderStageTimersRef.current = [];
    if (deporteLiderCloseTimerRef.current !== null) window.clearTimeout(deporteLiderCloseTimerRef.current);
    deporteLiderCloseTimerRef.current = window.setTimeout(() => {
      setIsDeporteLiderRendered(false);
      setDeporteLiderModalOrigin(null);
      deporteLiderCloseTimerRef.current = null;
    }, DEPORTE_LIDER_MODAL_ANIMATION_MS);
  };

  const closeDeporteHeatmapModal = () => {
    setIsDeporteHeatmapVisible(false);
    setDeporteHeatmapContentStage(0);

    deporteHeatmapStageTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    deporteHeatmapStageTimersRef.current = [];

    if (deporteHeatmapCloseTimerRef.current !== null) {
      window.clearTimeout(deporteHeatmapCloseTimerRef.current);
    }

    deporteHeatmapCloseTimerRef.current = window.setTimeout(() => {
      setIsDeporteHeatmapRendered(false);
      setDeporteHeatmapModalOrigin(null);
      deporteHeatmapCloseTimerRef.current = null;
    }, DEPORTE_HEATMAP_MODAL_ANIMATION_MS);
  };

  const handleProvinciaBarClick = (provinciaId: number) => {
    const prov = provinciasTop10?.provincias.find((p) => p.id === provinciaId);
    if (!prov) return;
    if (provinciaRankingCloseTimerRef.current !== null) {
      window.clearTimeout(provinciaRankingCloseTimerRef.current);
      provinciaRankingCloseTimerRef.current = null;
    }
    provinciaRankingStageTimersRef.current.forEach((t) => window.clearTimeout(t));
    provinciaRankingStageTimersRef.current = [];
    setSelectedProvinciaRanking(prov);
    setIsProvinciaRankingRendered(true);
    setProvinciaRankingContentStage(0);
    window.requestAnimationFrame(() => setIsProvinciaRankingVisible(true));
    provinciaRankingStageTimersRef.current.push(window.setTimeout(() => setProvinciaRankingContentStage(1), PROVINCIA_RANKING_HEADER_DELAY_MS));
    provinciaRankingStageTimersRef.current.push(window.setTimeout(() => setProvinciaRankingContentStage(2), PROVINCIA_RANKING_DETAIL_DELAY_MS));
  };

  const closeProvinciaRankingModal = () => {
    setIsProvinciaRankingVisible(false);
    setProvinciaRankingContentStage(0);
    provinciaRankingStageTimersRef.current.forEach((t) => window.clearTimeout(t));
    provinciaRankingStageTimersRef.current = [];
    if (provinciaRankingCloseTimerRef.current !== null) window.clearTimeout(provinciaRankingCloseTimerRef.current);
    provinciaRankingCloseTimerRef.current = window.setTimeout(() => {
      setIsProvinciaRankingRendered(false);
      setSelectedProvinciaRanking(null);
      provinciaRankingCloseTimerRef.current = null;
    }, PROVINCIA_RANKING_MODAL_ANIMATION_MS);
  };

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

  const clubDetailHighlight = clubesTotales?.clubConMasDeportistas;
  const totalClubesCount = clubesTotales?.totalClubes ?? 0;
  const topClubesPercent = topClubesDetalle?.porcentaje ?? 0;

  // -------- RENDER --------

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* MAIN */}
      <div className="flex-1 flex flex-col p-3 gap-3 sm:p-4">
        {/* ROW 2 — KPIs */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Total de Clubes"
            value={totalClubesCount}
            onClick={openTotalClubesModal}
            subtitle={clubesTotales ? (
              <span>
                Mas deportistas en: {" "}
                <span className="font-bold text-primary">
                  {clubDetailHighlight?.nombre ?? "-"} ({clubDetailHighlight?.totalDeportistas ?? 0})
                </span>
              </span>
            ) : (
              <span>
                Mas deportistas en: {" "}
                <span className="font-bold text-primary">- (0)</span>
              </span>
            )}
            icon={<Building2 className="h-5 w-5" />}
          />
          <KpiCard
            title="Total de Deportistas"
            value={deportistasTotales?.deportistas ?? 0}
            onClick={openTotalDeportistasModal}
            subtitle={deportistasTotales
              ? (
                <span>
                  {deportistasTotales.porcentaje.toLocaleString("es-AR")}% de {" "}
                  <span className="font-bold text-primary">
                    {deportistasTotales.provinciaLider}
                  </span>
                </span>
              ) : "Sin datos disponibles"}
            icon={<Users className="h-5 w-5" />}
          />
          <KpiCard
            title="Cantidad de Deportes"
            value={deportistasTotales?.deportes ?? 0}
            subtitle="Disciplinas con deportistas activos"
            onClick={openDeportesModal}
            icon={<BarChart3 className="h-5 w-5" />}
          />
          <KpiCard
            title="Deporte líder"
            value={deportistasTotales?.deporteLider ?? "-"}
            subtitle={
              <span>
                Con un total de {" "}
                <span className="font-bold text-primary">
                  {(deportistasTotales?.cantidadDeportistas ?? 0).toLocaleString()}
                </span>
                {" "}deportistas
              </span>
            }
            onClick={openDeporteLiderModal}
            icon={<Medal className="h-5 w-5" />}
          />
        </div>

        {/* ROW 3 — Map + Charts stack */}
        <div className="flex flex-col gap-3 xl:flex-row">

          {/* Map */}
          {/* No z-index here: it would create a stacking context that traps the map's
              fixed-position fullscreen overlay below later siblings (charts below it). */}
          <div className="relative bg-card border border-border rounded-xl overflow-hidden h-[460px] xl:h-auto xl:max-h-none xl:min-h-[52vh] xl:flex-none xl:w-1/2">
            <LeafletMap
              filters={filters}
              navigation={navigation}
              roleConfig={roleConfig}
              clubForRole={clubForRole}
              onProvinceClick={handleProvinceClick}
              onMunicipioClick={handleMunicipioClick}
              onClubClick={handleClubClick}
              onPolideportivoClick={handlePolideportivoClick}
              onConvenioClick={handleConvenioClick}
              onGimnasioClick={handleGimnasioClick}
              onFederacionClick={handleFederacionClick}
              onNavigateCountry={handleNavigateCountry}
            />
          </div>

          {/* Right charts — stacked */}
          <div className="flex flex-col gap-3 xl:flex-1 xl:min-w-0">
            <AthletesPerSportChart data={topDeportes ?? []} />
            <AgeDistributionChart ages={edadesApiData ?? []} />
          </div>
        </div>

        {/* ROW 4 — Province + Gender + Gender per Sport */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {roleConfig.role === "municipality" ? (
            <MunicipioRankingChart data={municipiosTop10} />
          ) : (
            <ProvinceRankingChart data={provinciasTop10} onBarClick={handleProvinciaBarClick} />
          )}
          <GenderDistributionChart data={genderDistribution} />
          <ClubRankingChart
            data={topClubes ?? []}
            onClubClick={handleClubClick}
          />
        </div>

        {/* ROW 5 — Cobertura deportiva por provincia */}
        <DeporteCoverageChart
          deportes={deportesAll ?? []}
          selectedId={selectedDeporteId}
          provinciasData={deporteProvincias}
          provinciasLoading={deporteProvinciasLoading}
          onDeporteClick={handleDeporteClick}
          onOpenHeatmap={openDeporteHeatmapModal}
        />

      </div>

      {/* CLUB MODAL */}
      {isTotalClubesRendered && (
        <>
          <div
            className={`fixed inset-0 z-40 bg-background/55 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isTotalClubesVisible ? "opacity-100 backdrop-blur-sm" : "opacity-0 backdrop-blur-0"
              }`}
            onClick={closeTotalClubesModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {(() => {
              const target = getTotalClubesModalTarget();
              const origin = totalClubesModalOrigin;

              const startLeft = origin ? Math.round(origin.left) : target?.left ?? 0;
              const startTop = origin ? Math.round(origin.top) : target?.top ?? 0;
              const startWidth = origin ? Math.round(origin.width) : target?.width ?? 0;
              const startHeight = origin ? Math.round(origin.height) : target?.height ?? 0;

              const endLeft = target?.left ?? startLeft;
              const endTop = target?.top ?? startTop;
              const endWidth = target?.width ?? startWidth;
              const endHeight = target?.height ?? startHeight;

              const modalStyle = isTotalClubesVisible
                ? {
                  left: `${endLeft}px`,
                  top: `${endTop}px`,
                  width: `${endWidth}px`,
                  height: `${endHeight}px`,
                }
                : {
                  left: `${startLeft}px`,
                  top: `${startTop}px`,
                  width: `${startWidth}px`,
                  height: `${startHeight}px`,
                };

              return (
                <div
                  className={`fixed z-50 overflow-hidden rounded-xl border border-border bg-card shadow-2xl transform-gpu will-change-transform will-change-opacity transition-[left,top,width,height,opacity,transform,box-shadow] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isTotalClubesVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.96]"
                    }`}
                  style={{
                    ...modalStyle,
                    background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--surface-elevated)) 100%)",
                  }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-primary transition-all duration-300" />
                  <div className="absolute left-0 top-0 h-1 w-full rounded-t-xl bg-primary" />
                  <div
                    className={`flex items-start justify-between px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4 transition-all duration-500 ${totalClubesContentStage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                      }`}
                    style={{ transitionDelay: totalClubesContentStage >= 1 ? "0ms" : "0ms" }}
                  >
                    <h3 className="text-base sm:text-xl font-semibold text-foreground pr-2">
                      Contamos con un total de <span className="text-primary">{totalClubesCount.toLocaleString("es-AR")}</span> de clubes
                    </h3>
                    <button
                      type="button"
                      onClick={closeTotalClubesModal}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/30 hover:text-primary transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                      aria-label="Cerrar detalle de clubes"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="px-3 pb-2 pt-2 flex flex-col sm:px-4 overflow-y-auto h-[calc(100%-68px)] sm:h-[calc(100%-76px)]">
                    <div
                      className={`transition-all duration-500 ${totalClubesContentStage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                        }`}
                      style={{ transitionDelay: totalClubesContentStage >= 2 ? "0ms" : "0ms" }}
                    >
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        {clubDetailHighlight?.logoUrl ? (
                          <img
                            src={clubDetailHighlight.logoUrl}
                            alt={clubDetailHighlight.nombre}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            C
                          </span>
                        )}
                        <span className="text-sm font-semibold text-foreground">{clubDetailHighlight?.nombre ?? "-"}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Es el club destacado con un total de
                        <span className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 font-semibold text-primary text-xs mx-1">
                          {clubDetailHighlight?.totalDeportistas?.toLocaleString("es-AR") ?? "0"}
                        </span>
                        deportistas, en
                        <span className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 font-semibold text-primary text-xs mx-1">
                          {clubDetailHighlight?.totalDeportes ?? 0}
                        </span>
                        deportes
                      </p>
                    </div>

                    <div
                      className={`text-md mb-3 transition-all duration-500 ${totalClubesContentStage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                        }`}
                      style={{ transitionDelay: totalClubesContentStage >= 3 ? "0ms" : "0ms" }}
                    >
                      <span>Estos son los diez clubes mas importantes y representan un</span>
                      <span className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 font-semibold text-primary text-xs mx-1">
                        {topClubesPercent}%
                      </span>
                      <span>del total de nuestros deportistas:</span>
                    </div>

                    {totalClubesContentStage >= 4 && (
                      <div className="flex-1 -mx-5 px-5 transition-all duration-700 opacity-100 translate-y-0">
                        <ClubRankingChart
                          data={topClubesChartData}
                          customHeight={320}
                          onClubClick={handleClubClick}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* DEPORTISTAS MODAL */}
      {isTotalDeportistasRendered && (
        <>
          <div
            className={`fixed inset-0 z-40 bg-background/55 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isTotalDeportistasVisible ? "opacity-100 backdrop-blur-sm" : "opacity-0 backdrop-blur-0"
              }`}
            onClick={closeTotalDeportistasModal}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {(() => {
              const target = getTotalClubesModalTarget();
              const origin = totalDeportistasModalOrigin;

              const startLeft = origin ? Math.round(origin.left) : target?.left ?? 0;
              const startTop = origin ? Math.round(origin.top) : target?.top ?? 0;
              const startWidth = origin ? Math.round(origin.width) : target?.width ?? 0;
              const startHeight = origin ? Math.round(origin.height) : target?.height ?? 0;

              const endLeft = target?.left ?? startLeft;
              const endTop = target?.top ?? startTop;
              const endWidth = target?.width ?? startWidth;
              const endHeight = target?.height ?? startHeight;

              const modalStyle = isTotalDeportistasVisible
                ? {
                  left: `${endLeft}px`,
                  top: `${endTop}px`,
                  width: `${endWidth}px`,
                  height: `${endHeight}px`,
                }
                : {
                  left: `${startLeft}px`,
                  top: `${startTop}px`,
                  width: `${startWidth}px`,
                  height: `${startHeight}px`,
                };

              return (
                <div
                  className={`fixed z-50 overflow-hidden rounded-xl border border-border bg-card shadow-2xl transform-gpu will-change-transform will-change-opacity transition-[left,top,width,height,opacity,transform,box-shadow] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isTotalDeportistasVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.96]"
                    }`}
                  style={{
                    ...modalStyle,
                    background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--surface-elevated)) 100%)",
                  }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-primary transition-all duration-300" />
                  <div className="absolute left-0 top-0 h-1 w-full rounded-t-xl bg-primary" />
                  <div
                    className={`flex items-start justify-between px-4 pt-4 pb-2 sm:px-5 sm:pt-5 transition-all duration-500 ${totalDeportistasContentStage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                      }`}
                  >
                    <h3 className="text-base sm:text-xl font-semibold text-foreground pr-2">
                      Contamos con <span className="text-primary">{(deportistasTotales?.deportistas ?? 0).toLocaleString("es-AR")}</span> deportistas registrados
                    </h3>
                    <button
                      type="button"
                      onClick={closeTotalDeportistasModal}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/30 hover:text-primary transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
                      aria-label="Cerrar detalle de deportistas"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="px-3 pb-3 pt-1 flex flex-col h-[calc(100%-68px)] overflow-y-auto sm:px-4 sm:pb-4 sm:h-[calc(100%-76px)]">
                    {topProvinciasDeportistas.length > 0 && (
                      <div
                        className={`transition-all duration-500 ${totalDeportistasContentStage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                          }`}
                      >
                        <div className="space-y-1 mb-4 text-sm text-foreground">
                            <p>
                            La provincia de <span className="font-semibold text-primary">{topProvinciasDeportistas[0].nombre}</span> concentra el
                            <span className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 font-semibold text-primary text-xs mx-1">
                              {topProvinciasDeportistas[0].porcentaje}%
                            </span>
                            del total, siendo la provincia con mas deportistas. Le siguen:
                          </p>

                          {(topProvinciasDeportistas.slice(1, 3).length > 0
                            ? topProvinciasDeportistas.slice(1, 3)
                            : [
                                { nombre: "Provincia ejemplo", porcentaje: 0 },
                                { nombre: "Provincia ejemplo", porcentaje: 0 },
                              ]
                          ).map((item, index) => (
                            <div key={`${item.nombre}-${index}`} className="flex items-start gap-2 pl-1">
                              <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                                <MapPin className="h-2.5 w-2.5" />
                              </span>
                              <p className="leading-6 text-muted-foreground">
                                <span className="font-semibold text-primary">{item.nombre}</span> concentrando el
                                <span className="font-semibold text-primary"> {item.porcentaje}%</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div
                      className={`flex items-center gap-2 mb-3 transition-all duration-500 ${totalDeportistasContentStage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                        }`}
                    >
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm font-normal text-normal">Distribución por Género:</span>
                    </div>

                    {totalDeportistasContentStage >= 4 && (
                      <div className="transition-all duration-700 opacity-100 translate-y-0 space-y-4">
                        {deportistasGeneros && (femalePercent > 0 || malePercent > 0) ? (
                          <>
                            <div className="rounded-full overflow-hidden border border-border h-14 flex shadow-md bg-background">
                              <button
                                type="button"
                                onClick={() => handleGenderSelect("femenino")}
                                  className={`h-full flex items-center justify-center gap-1.5 text-white font-semibold text-sm transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${selectedGeneroDetalle === "femenino" ? "ring-4 ring-pink-300 ring-inset scale-[1.01] shadow-[0_0_0_1px_rgba(236,72,153,0.35)]" : "opacity-90 hover:opacity-100"
                                  }`}
                                style={{
                                  width: `${genderSplitAnimated ? femalePercent : 0}%`,
                                  minWidth: femalePercent > 0 ? "92px" : "0px",
                                  background: "linear-gradient(90deg, rgba(236,72,153,0.96) 0%, rgba(219,39,119,0.96) 100%)",
                                }}
                              >
                                <Venus className="h-4 w-4" />
                                <span>{femalePercent}%</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleGenderSelect("masculino")}
                                  className={`h-full flex items-center justify-center gap-1.5 text-white font-semibold text-sm transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${selectedGeneroDetalle === "masculino" ? "ring-4 ring-blue-300 ring-inset scale-[1.01] shadow-[0_0_0_1px_rgba(37,99,235,0.35)]" : "opacity-90 hover:opacity-100"
                                  }`}
                                style={{
                                  width: `${genderSplitAnimated ? malePercent : 0}%`,
                                  minWidth: malePercent > 0 ? "92px" : "0px",
                                  background: "linear-gradient(90deg, rgba(37,99,235,0.96) 0%, rgba(29,78,216,0.96) 100%)",
                                }}
                              >
                                <Mars className="h-4 w-4" />
                                <span>{malePercent}%</span>
                              </button>
                            </div>

                            <div className={`rounded-xl border p-3 ${genderDetail.bg} ${genderDetail.border} transition-all duration-700`}> 
                              {typeof genderDetail.averageAge === "number" && (
                                <p className="text-sm text-foreground mb-1.5">
                                    En <span className={`font-semibold ${genderDetail.accent}`}>{(selectedGeneroDetalle === "femenino" ? deportistasGeneros?.femenino : deportistasGeneros?.masculino) ?? 0}</span> deportistas, tenemos un promedio de edad de <span className={`font-semibold ${genderDetail.accent}`}>{Math.round(genderDetail.averageAge)}</span> años.
                                </p>
                              )}
                              {genderDetail.deporte && (
                                <p className="text-sm text-foreground">
                                  Deporte más practicado:
                                  <span className={`font-semibold ${genderDetail.accent}`}> {genderDetail.deporte}</span>
                                </p>
                              )}
                            </div>

                            <div className={`rounded-xl border border-border bg-background/70 p-3 shadow-sm transition-all duration-1000 ${genderSplitAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
                              <div className="mb-2">
                                <p className="text-xs font-normal tracking-wider text-muted-foreground">
                                  Histograma etario
                                </p>
                              </div>
                              <div className="h-[180px]">
                                <AgeDistributionChart
                                  ages={selectedGeneroDetalle === "femenino" ? (edadesFemenino ?? []) : (edadesMasculino ?? [])}
                                  siblingAges={selectedGeneroDetalle === "femenino" ? (edadesMasculino ?? []) : (edadesFemenino ?? [])}
                                  fillHeight
                                  showCard={false}
                                  genero={selectedGeneroDetalle}
                                />
                              </div>
                            </div>
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* DEPORTES MODAL */}
      {isDeportesRendered && (() => {
        const target = getModalTarget();
        const origin = deportesModalOrigin;
        const startLeft = origin ? Math.round(origin.left) : target?.left ?? 0;
        const startTop = origin ? Math.round(origin.top) : target?.top ?? 0;
        const startWidth = origin ? Math.round(origin.width) : target?.width ?? 0;
        const startHeight = origin ? Math.round(origin.height) : target?.height ?? 0;
        const endLeft = target?.left ?? startLeft;
        const endTop = target?.top ?? startTop;
        const endWidth = target?.width ?? startWidth;
        const endHeight = target?.height ?? startHeight;
        const modalStyle = isDeportesVisible
          ? { left: `${endLeft}px`, top: `${endTop}px`, width: `${endWidth}px`, height: `${endHeight}px` }
          : { left: `${startLeft}px`, top: `${startTop}px`, width: `${startWidth}px`, height: `${startHeight}px` };
        return (
          <>
            <div
              className={`fixed inset-0 z-40 bg-background/55 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isDeportesVisible ? "opacity-100 backdrop-blur-sm" : "opacity-0 backdrop-blur-0"}`}
              onClick={closeDeportesModal}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className={`fixed z-50 overflow-hidden rounded-xl border border-border bg-card shadow-2xl transform-gpu will-change-transform will-change-opacity transition-[left,top,width,height,opacity,transform,box-shadow] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isDeportesVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.96]"}`}
                style={{ ...modalStyle, background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--surface-elevated)) 100%)" }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-primary" />
                <div className="absolute left-0 top-0 h-1 w-full rounded-t-xl bg-primary" />
                <div className={`flex items-start justify-between px-4 pt-4 pb-3 sm:px-5 sm:pt-5 transition-all duration-500 ${deportesContentStage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
                  <div className="pr-2">
                    <h3 className="text-base sm:text-xl font-semibold text-foreground">
                      <span className="text-primary">{deportistasTotales?.deportes ?? 0}</span> deportes activos
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Disciplinas con deportistas registrados</p>
                  </div>
                  <button type="button" onClick={closeDeportesModal} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/30 hover:text-primary transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center" aria-label="Cerrar">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="px-3 pb-3 flex flex-col gap-3 h-[calc(100%-72px)] overflow-y-auto sm:px-4 sm:pb-4 sm:h-[calc(100%-80px)]">
                  {deportesInsights && (
                    <div className={`grid grid-cols-2 gap-2 transition-all duration-500 ${deportesContentStage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
                      <div className="rounded-xl border border-pink-200 bg-pink-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-pink-600 mb-1 flex items-center gap-1">
                          <Venus className="h-3 w-3" /> Mayor participación femenina
                        </p>
                        <p className="text-sm text-foreground font-semibold">{deportesInsights.masFemenino.sport}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <span className="font-bold text-pink-600">{deportesInsights.masFemenino.pctF}%</span> de sus deportistas son mujeres
                        </p>
                      </div>
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1 flex items-center gap-1">
                          <Mars className="h-3 w-3" /> Mayor participación masculina
                        </p>
                        <p className="text-sm text-foreground font-semibold">{deportesInsights.masMasculino.sport}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <span className="font-bold text-blue-600">{deportesInsights.masMasculino.pctM}%</span> de sus deportistas son hombres
                        </p>
                      </div>
                    </div>
                  )}
                  <div className={`transition-all duration-500 ${deportesContentStage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Distribución femenino / masculino por disciplina:
                    </p>
                  </div>
                  <div className={`flex-1 min-h-0 transition-all duration-500 ${deportesContentStage >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"}`}>
                    <GenderBalanceByDeportChart data={topDeportesTop10 ?? topDeportes ?? []} />
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* DEPORTE LÍDER MODAL */}
      {isDeporteLiderRendered && (() => {
        const target = getModalTarget();
        const origin = deporteLiderModalOrigin;
        const startLeft = origin ? Math.round(origin.left) : target?.left ?? 0;
        const startTop = origin ? Math.round(origin.top) : target?.top ?? 0;
        const startWidth = origin ? Math.round(origin.width) : target?.width ?? 0;
        const startHeight = origin ? Math.round(origin.height) : target?.height ?? 0;
        const endLeft = target?.left ?? startLeft;
        const endTop = target?.top ?? startTop;
        const endWidth = target?.width ?? startWidth;
        const endHeight = target?.height ?? startHeight;
        const modalStyle = isDeporteLiderVisible
          ? { left: `${endLeft}px`, top: `${endTop}px`, width: `${endWidth}px`, height: `${endHeight}px` }
          : { left: `${startLeft}px`, top: `${startTop}px`, width: `${startWidth}px`, height: `${startHeight}px` };
        const liderTotal = deporteLiderStats ? deporteLiderStats.lider.male + deporteLiderStats.lider.female : 0;
        return (
          <>
            <div
              className={`fixed inset-0 z-40 bg-background/55 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isDeporteLiderVisible ? "opacity-100 backdrop-blur-sm" : "opacity-0 backdrop-blur-0"}`}
              onClick={closeDeporteLiderModal}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className={`fixed z-50 overflow-hidden rounded-xl border border-border bg-card shadow-2xl transform-gpu will-change-transform will-change-opacity transition-[left,top,width,height,opacity,transform,box-shadow] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isDeporteLiderVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.96]"}`}
                style={{ ...modalStyle, background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--surface-elevated)) 100%)" }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-primary" />
                <div className="absolute left-0 top-0 h-1 w-full rounded-t-xl bg-primary" />
                <div className={`flex items-start justify-between px-4 pt-4 pb-3 sm:px-5 sm:pt-5 transition-all duration-500 ${deporteLiderContentStage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
                      <Medal className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-xl font-semibold text-foreground truncate">{deportistasTotales?.deporteLider ?? "-"}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Deporte líder en deportistas activos</p>
                    </div>
                  </div>
                  <button type="button" onClick={closeDeporteLiderModal} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/30 hover:text-primary transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center" aria-label="Cerrar">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="px-3 pb-3 flex flex-col gap-3 h-[calc(100%-72px)] overflow-y-auto sm:px-4 sm:pb-4 sm:h-[calc(100%-80px)]">
                  <div className={`transition-all duration-500 ${deporteLiderContentStage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="rounded-xl border border-border bg-background/70 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Deportistas</p>
                        <p className="text-2xl font-bold text-primary font-mono">
                          {(deportistasTotales?.cantidadDeportistas ?? 0).toLocaleString("es-AR")}
                        </p>
                        {deporteLiderStats && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            <span className="font-bold text-sm text-foreground">{deporteLiderStats.pctDelTotal}%</span> del total nacional
                          </p>
                        )}
                      </div>
                      {deporteLiderStats?.segundo && (
                        <div className="rounded-xl border border-border bg-background/70 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">2do deporte</p>
                          <p className="text-base font-semibold text-foreground">{deporteLiderStats.segundo.sport}</p>
                          <p className="text-sm text-primary font-semibold mt-0.5">
                            {(deporteLiderStats.segundo.male + deporteLiderStats.segundo.female).toLocaleString("es-AR")} <span className="text-muted-foreground font-normal">deportistas</span>
                          </p>
                        </div>
                      )}
                    </div>
                    {deporteLiderStats && liderTotal > 0 && (
                      <div className="rounded-xl border border-border bg-background/70 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Distribución por género</p>
                        <div className="flex h-8 w-full overflow-hidden rounded-lg">
                          <div
                            className="flex items-center justify-center gap-1 text-white text-xs font-semibold"
                            style={{ width: `${deporteLiderStats.pctF}%`, background: "linear-gradient(90deg, #db2777, #be185d)" }}
                          >
                            {deporteLiderStats.pctF > 10 && <><Venus className="h-3 w-3" /><span>{deporteLiderStats.pctF}%</span></>}
                          </div>
                          <div
                            className="flex items-center justify-center gap-1 text-white text-xs font-semibold"
                            style={{ width: `${deporteLiderStats.pctM}%`, background: "linear-gradient(90deg, #2563eb, #1d4ed8)" }}
                          >
                            {deporteLiderStats.pctM > 10 && <><Mars className="h-3 w-3" /><span>{deporteLiderStats.pctM}%</span></>}
                          </div>
                        </div>
                        <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                          <span><span className="font-semibold text-pink-600">{deporteLiderStats.lider.female.toLocaleString("es-AR")}</span> mujeres</span>
                          <span><span className="font-semibold text-blue-600">{deporteLiderStats.lider.male.toLocaleString("es-AR")}</span> hombres</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {deporteLiderContentStage >= 3 && deporteLiderStats && (
                    <div className={`rounded-xl border border-border bg-background/70 p-3 transition-all duration-500 opacity-100 translate-y-0`}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Comparativa top deportes
                      </p>
                      <div className="space-y-1.5">
                        {(topDeportesTop10 ?? []).map((d, i) => {
                          const tot = d.male + d.female;
                          const maxTot = Math.max(...(topDeportesTop10 ?? []).map((x) => x.male + x.female), 1);
                          const isLider = d.sport.toLowerCase() === (deportistasTotales?.deporteLider ?? "").toLowerCase();
                          return (
                            <div key={d.sport} className="flex items-center gap-1.5 sm:gap-2">
                              <span className="text-xs text-muted-foreground w-4 text-right shrink-0">{i + 1}</span>
                              <div className="flex-1 h-5 bg-border/40 rounded overflow-hidden min-w-0">
                                <div
                                  className={`h-full rounded ${isLider ? "bg-primary" : "bg-primary/30"}`}
                                  style={{
                                    width: `${deporteLiderBarsAnimated ? (tot / maxTot) * 100 : 0}%`,
                                    transition: "width 900ms cubic-bezier(0.22,1,0.36,1)",
                                    transitionDelay: `${i * 90}ms`,
                                  }}
                                />
                              </div>
                              <span className={`text-xs w-20 sm:w-28 truncate shrink-0 ${isLider ? "font-semibold text-primary" : "text-muted-foreground"}`}>{d.sport}</span>
                              <span className="text-xs text-muted-foreground w-12 sm:w-16 text-right shrink-0">{tot.toLocaleString("es-AR")}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* DEPORTE HEATMAP MODAL */}
      {isDeporteHeatmapRendered && deporteProvincias && (() => {
        const target = getHeatmapModalTarget();
        const origin = deporteHeatmapModalOrigin;
        const startLeft = origin ? Math.round(origin.left) : target?.left ?? 0;
        const startTop = origin ? Math.round(origin.top) : target?.top ?? 0;
        const startWidth = origin ? Math.round(origin.width) : target?.width ?? 0;
        const startHeight = origin ? Math.round(origin.height) : target?.height ?? 0;
        const endLeft = target?.left ?? startLeft;
        const endTop = target?.top ?? startTop;
        const endWidth = target?.width ?? startWidth;
        const endHeight = target?.height ?? startHeight;
        const modalStyle = isDeporteHeatmapVisible
          ? { left: `${endLeft}px`, top: `${endTop}px`, width: `${endWidth}px`, height: `${endHeight}px` }
          : { left: `${startLeft}px`, top: `${startTop}px`, width: `${startWidth}px`, height: `${startHeight}px` };

        return (
          <>
            <div
              className={`fixed inset-0 z-40 bg-background/55 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isDeporteHeatmapVisible ? "opacity-100 backdrop-blur-sm" : "opacity-0 backdrop-blur-0"}`}
              onClick={closeDeporteHeatmapModal}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className={`fixed z-50 overflow-hidden rounded-xl border border-border bg-card shadow-2xl transform-gpu will-change-transform will-change-opacity transition-[left,top,width,height,opacity,transform,box-shadow] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isDeporteHeatmapVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.96]"}`}
                style={{ ...modalStyle, background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--surface-elevated)) 100%)" }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-primary" />
                <div className="absolute left-0 top-0 h-1 w-full rounded-t-xl bg-primary" />
                <div className={`flex items-start justify-between px-4 pt-4 pb-3 sm:px-5 sm:pt-5 transition-all duration-500 ${deporteHeatmapContentStage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0 pr-2">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
                      <Volleyball className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-xl font-semibold text-foreground truncate">{deporteProvincias?.deporte?.nombre ?? "-"}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Mapa de calor de todas las provincias que practican este deporte por cantidad de deportistas</p>
                    </div>
                  </div>
                  <button type="button" onClick={closeDeporteHeatmapModal} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/30 hover:text-primary transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center" aria-label="Cerrar">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className={`px-3 pb-3 flex flex-col gap-3 h-[calc(100%-72px)] overflow-hidden transition-all duration-500 sm:px-4 sm:pb-4 sm:h-[calc(100%-80px)] ${deporteHeatmapContentStage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-border bg-background/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total de provincias</p>
                      <p className="text-2xl font-bold text-primary font-mono">{deporteProvincias.totalProvincias.toLocaleString("es-AR")}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total de deportistas</p>
                      <p className="text-2xl font-bold text-primary font-mono">{deporteProvincias.totalDeportistas.toLocaleString("es-AR")}</p>
                    </div>
                  </div>
                  {deporteHeatmapContentStage >= 3 && (
                    <div className="flex-1 min-h-0">
                      <DeporteHeatMap data={deporteProvincias} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* PROVINCIA RANKING MODAL */}
      {isProvinciaRankingRendered && selectedProvinciaRanking && (() => {
        const target = getModalTarget();
        const endLeft = target?.left ?? 0;
        const endTop = target?.top ?? 0;
        const endWidth = target?.width ?? 0;
        const endHeight = Math.min(440, target?.height ?? 0);
        const modalStyle = isProvinciaRankingVisible
          ? { left: `${endLeft}px`, top: `${endTop}px`, width: `${endWidth}px`, height: `${endHeight}px` }
          : { left: `${endLeft}px`, top: `${endTop}px`, width: `${endWidth}px`, height: `${endHeight}px` };
        return (
          <>
            <div
              className={`fixed inset-0 z-40 bg-background/55 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isProvinciaRankingVisible ? "opacity-100 backdrop-blur-sm" : "opacity-0 backdrop-blur-0"}`}
              onClick={closeProvinciaRankingModal}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className={`fixed z-50 overflow-hidden rounded-xl border border-border bg-card shadow-2xl transform-gpu will-change-transform will-change-opacity transition-[left,top,width,height,opacity,transform,box-shadow] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col ${isProvinciaRankingVisible ? "opacity-100 scale-100" : "opacity-0 scale-[0.96]"}`}
                style={{ ...modalStyle, background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--surface-elevated)) 100%)" }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-primary" />
                <div className="absolute left-0 top-0 h-1 w-full rounded-t-xl bg-primary" />
                <div className={`flex items-start justify-between px-4 pt-4 pb-3 sm:px-5 sm:pt-5 transition-all duration-500 ${provinciaRankingContentStage >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
                  <div className="pr-2">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h3 className="text-base sm:text-xl font-semibold text-foreground">
                        {selectedProvinciaRanking.nombre === "Ciudad Autónoma de Buenos Aires (CABA)" ? "CABA" : selectedProvinciaRanking.nombre}
                      </h3>
                      <span className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/10 px-2 py-0.5 font-bold text-primary text-sm">
                        #{selectedProvinciaRanking.posicion}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Ranking por cantidad de deportistas</p>
                  </div>
                  <button type="button" onClick={closeProvinciaRankingModal} className="rounded-md p-1.5 text-muted-foreground hover:bg-primary/30 hover:text-primary transition-colors shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center" aria-label="Cerrar">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className={`px-3 pb-3 flex flex-col gap-2.5 transition-all duration-500 sm:px-4 sm:pb-4 ${provinciaRankingContentStage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-border bg-background/70 p-2.5 space-y-0.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total deportistas</p>
                      <p className="text-2xl font-bold text-primary font-mono">{selectedProvinciaRanking.totalAthletes.toLocaleString("es-AR")}</p>
                      {provinciaRankingStats && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{provinciaRankingStats.pctNacional}%</span> nacional
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg border border-border bg-background/70 p-2.5 space-y-0.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clubes</p>
                      <p className="text-2xl font-bold text-primary font-mono">{selectedProvinciaRanking.totalClubs.toLocaleString("es-AR")}</p>
                    </div>
                  </div>
                  {provinciaRankingStats && (
                    <>
                      <div className="rounded-lg border border-border bg-background/70 p-2.5 space-y-1.5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Distribución por género</p>
                        <div className="flex h-7 w-full overflow-hidden rounded-md">
                          <div
                            className="flex items-center justify-center gap-0.5 text-white text-xs font-semibold"
                            style={{ width: `${provinciaRankingStats.pctF}%`, background: "linear-gradient(90deg, #db2777, #be185d)" }}
                          >
                            {provinciaRankingStats.pctF > 8 && <><Venus className="h-3 w-3" /><span>{provinciaRankingStats.pctF}%</span></>}
                          </div>
                          <div
                            className="flex items-center justify-center gap-0.5 text-white text-xs font-semibold"
                            style={{ width: `${provinciaRankingStats.pctM}%`, background: "linear-gradient(90deg, #2563eb, #1d4ed8)" }}
                          >
                            {provinciaRankingStats.pctM > 8 && <><Mars className="h-3 w-3" /><span>{provinciaRankingStats.pctM}%</span></>}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-muted-foreground"><span className="font-semibold text-pink-600">{selectedProvinciaRanking.totalMujeres.toLocaleString("es-AR")}</span> mujeres</div>
                          <div className="text-muted-foreground"><span className="font-semibold text-blue-600">{selectedProvinciaRanking.totalHombres.toLocaleString("es-AR")}</span> hombres</div>
                        </div>
                      </div>
                      {provinciaRankingStats.pctPoblacion !== null && (
                        <div className="rounded-lg border border-border bg-background/70 p-2.5 space-y-1.5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Participación (INDEC 2022)
                          </p>
                          <div className="space-y-1">
                            <div>
                              <p className="text-xs text-muted-foreground">% de la población</p>
                              <p className="text-2xl font-bold text-primary font-mono">{provinciaRankingStats.pctPoblacion}%</p>
                            </div>
                            {provinciaRankingStats.poblacion && (
                              <p className="text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">{provinciaRankingStats.poblacion.toLocaleString("es-AR")}</span> habitantes
                              </p>
                            )}
                            {provinciaRankingStats.rankingPorPoblacion !== null && (
                              <span className="inline-flex items-center rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 font-semibold text-primary text-xs">
                                #{provinciaRankingStats.rankingPorPoblacion} ranking
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {selectedClubId && (
        <>
          <div
            className="fixed inset-0 z-50 bg-background/50 backdrop-blur-sm"
            onClick={() => { if (roleConfig.role !== "club") setSelectedClubId(null); }}
          />
          <ClubDetailPanel
            clubId={selectedClubId}
            onClose={() => { if (roleConfig.role !== "club") setSelectedClubId(null); }}
          />
        </>
      )}

      {selectedInfraId && (
        <>
          <div
            className="fixed inset-0 z-50 bg-background/50 backdrop-blur-sm"
            onClick={() => setSelectedInfraId(null)}
          />
          <PolideportivoDetailPanel
            polideportivoId={selectedInfraId}
            onClose={() => setSelectedInfraId(null)}
          />
        </>
      )}

      {selectedFederacionId && (
        <>
          <div
            className="fixed inset-0 z-50 bg-background/50 backdrop-blur-sm"
            onClick={() => setSelectedFederacionId(null)}
          />
          <FederacionDetailPanel
            federacionId={selectedFederacionId}
            onClose={() => setSelectedFederacionId(null)}
          />
        </>
      )}
    </div>
  );
}

export default Dashboard;
