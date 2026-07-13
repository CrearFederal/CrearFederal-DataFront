import { useCallback, useEffect, useMemo, useState } from "react";
import { TrendingDown, TrendingUp, Users, MapPinHouse, BookUser, ClipboardCheck } from "lucide-react";
import KpiCard from "../components/KpiCard";
import ProvinceComparisonChart from "../components/ChartProvEvaluaciones";
import MunicipiosEvaluacionesChart from "../components/ChartMunicipiosEvaluaciones";
import MonthlyEvaluationsChart from "../components/ChartMesesEvaluaciones";
import ChartCakeNiveles from "../components/ChartCakeNiveles";
import { GenderDistributionChart } from "../components/Charts";
import { authBootstrap, getAuthMe, sendLogoutOnPageClose } from "../api/session";
import { getEvaluacionesDistribucionGenero, getEvaluacionesEvolucionMensual, getEvaluacionesPorNivel, getEvaluacionesResumen, getEvaluacionesProvinciasTop10, getEvaluacionesMunicipiosTop10 } from "../data/evaluacionesApi";
import type { AuthScope } from "../types/auth";
import type {
	EvaluacionesDistribucionGeneroResponse,
	EvaluacionesEvolucionMensualItem,
	EvaluacionesMunicipioTop10Item,
	EvaluacionesProvinciaTop10Item,
	EvaluacionesPorNivelItem,
	EvaluacionesResumenResponse,
} from "../types/Evaluaciones";
import type { UserRoleConfig } from "../data/roles";

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

const formatTrendPct = (value: number | null | undefined): string => {
	if (value == null || !isFinite(value)) return "+0%";
	const sign = value < 0 ? "" : "+";
	return `${sign}${value.toLocaleString("es-AR")}%`;
};

const TrendIndicator = ({ value }: { value: number | null | undefined }) => {
	const v = value ?? 0;
	const isNegative = v < 0;
	const Icon = isNegative ? TrendingDown : TrendingUp;
	const trendText = formatTrendPct(v);

	return (
		<span className={`inline-flex items-center gap-1 align-middle font-bold leading-none ${isNegative ? "text-red-600" : "text-primary"}`}>
			<Icon className="h-4 w-4 shrink-0 translate-y-px" />
			{trendText}
		</span>
	);
};

const getScopeDisplayName = (roleConfig: UserRoleConfig): string => {
	switch (roleConfig.role) {
		case "coa":
			return "Argentina";
		case "province":
			return "esta provincia";
		case "municipality":
			return "este municipio";
		case "federation":
			return roleConfig.federationScope === "national"
				? "la federación nacional"
				: "la federación provincial";
		default:
			return "Argentina";
	}
};

const emptyResumen: EvaluacionesResumenResponse = {
	evaluacionesTotales: 0,
	evaluacionesAnterior: 0,
	evaluacionesVsAnteriorPct: 0,
	lotesTotales: 0,
	lotesAnterior: 0,
	lotesVsAnteriorPct: 0,
	clubesAlcanzados: 0,
	clubesAlcanzadosAnterior: 0,
	clubesAlcanzadosVsAnteriorPct: 0,
	personasEvaluadas: 0,
	mesActual: "",
	personasAnterior: 0,
	mesAnterior: "",
	personasVsAnteriorPct: 0,
	totalMunicipios: 0,
	municipiosAlcanzados: 0,
	municipiosVsTotalPct: 0,
	personasEvaluadasAño: 0,
	añoActual: 0,
	personasEvaluadasAñoAnterior: 0,
	añoAnterior: 0,
	personasVsAnteiorAñoPct: 0
};

function Evaluaciones() {
	const [roleConfig, setRoleConfig] = useState<UserRoleConfig | null>(null);
	const [authStatus, setAuthStatus] = useState<"loading" | "ready" | "error">("loading");
	const [resumen, setResumen] = useState<EvaluacionesResumenResponse | null>(null);
	const [provinciasComparativa, setProvinciasComparativa] = useState<EvaluacionesProvinciaTop10Item[]>([]);
	const [municipiosComparativa, setMunicipiosComparativa] = useState<EvaluacionesMunicipioTop10Item[]>([]);
	const [provinciaDrill, setProvinciaDrill] = useState<{ id: number; nombre: string } | null>(null);
	const [evolucionMensual, setEvolucionMensual] = useState<EvaluacionesEvolucionMensualItem[]>([]);
	const [nivelesEvaluados, setNivelesEvaluados] = useState<EvaluacionesPorNivelItem[]>([]);
	const [distribucionGenero, setDistribucionGenero] = useState<EvaluacionesDistribucionGeneroResponse | null>(null);

	const isAbortError = useCallback((error: unknown): boolean => {
		if (error instanceof DOMException && error.name === "AbortError") {
			return true;
		}

		if (typeof error === "object" && error !== null) {
			const err = error as { name?: string; code?: string };
			return err.name === "CanceledError" || err.code === "ERR_CANCELED";
		}

		return false;
	}, []);

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
	}, [isAbortError]);

	useEffect(() => {
		if (authStatus !== "ready") return;

		const controller = new AbortController();

		const loadResumen = async () => {
			try {
				const data = await getEvaluacionesResumen(controller.signal);
				if (!controller.signal.aborted) {
					setResumen(data);
				}
			} catch {
				if (!controller.signal.aborted) {
					setResumen(null);
				}
			}
		};

		void loadResumen();

		return () => controller.abort();
	}, [authStatus]);

	useEffect(() => {
		if (authStatus !== "ready") return;

		const controller = new AbortController();

		const loadDistribucionGenero = async () => {
			try {
				const data = await getEvaluacionesDistribucionGenero(controller.signal);
				if (!controller.signal.aborted) {
					setDistribucionGenero(data);
				}
			} catch {
				if (!controller.signal.aborted) {
					setDistribucionGenero(null);
				}
			}
		};

		void loadDistribucionGenero();

		return () => controller.abort();
	}, [authStatus]);

	useEffect(() => {
		if (authStatus !== "ready") return;

		const controller = new AbortController();

		const loadNiveles = async () => {
			try {
				const data = await getEvaluacionesPorNivel(controller.signal);
				if (!controller.signal.aborted) {
					setNivelesEvaluados(data.niveles ?? []);
				}
			} catch {
				if (!controller.signal.aborted) {
					setNivelesEvaluados([]);
				}
			}
		};

		void loadNiveles();

		return () => controller.abort();
	}, [authStatus]);

	useEffect(() => {
		if (authStatus !== "ready") return;

		const controller = new AbortController();

		const loadEvolucionMensual = async () => {
			try {
				const data = await getEvaluacionesEvolucionMensual(controller.signal);
				if (!controller.signal.aborted) {
					setEvolucionMensual(data.evolucion ?? []);
				}
			} catch {
				if (!controller.signal.aborted) {
					setEvolucionMensual([]);
				}
			}
		};

		void loadEvolucionMensual();

		return () => controller.abort();
	}, [authStatus]);

	useEffect(() => {
		if (authStatus !== "ready") return;

		const controller = new AbortController();

		const loadProvincias = async () => {
			try {
				const data = await getEvaluacionesProvinciasTop10(controller.signal);
				if (!controller.signal.aborted) {
					setProvinciasComparativa(data.provincias ?? []);
				}
			} catch {
				if (!controller.signal.aborted) {
					setProvinciasComparativa([]);
				}
			}
		};

		void loadProvincias();

		return () => controller.abort();
	}, [authStatus]);

	useEffect(() => {
		if (authStatus !== "ready" || !roleConfig) return;

		const isMunicipalityRole = roleConfig.role === "municipality";
		if (!isMunicipalityRole && !provinciaDrill) {
			setMunicipiosComparativa([]);
			return;
		}

		const controller = new AbortController();

		const loadMunicipios = async () => {
			try {
				const data = await getEvaluacionesMunicipiosTop10(provinciaDrill?.id, controller.signal);
				if (!controller.signal.aborted) {
					setMunicipiosComparativa(data.municipios ?? []);
				}
			} catch {
				if (!controller.signal.aborted) {
					setMunicipiosComparativa([]);
				}
			}
		};

		void loadMunicipios();

		return () => controller.abort();
	}, [authStatus, roleConfig, provinciaDrill]);

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

	const resumenData = resumen ?? emptyResumen;
	const scopeDisplayName = roleConfig ? getScopeDisplayName(roleConfig) : "Argentina";
	const evaluacionesGenderDistribution = useMemo(
		() => ({
			male: distribucionGenero?.masculinoCantidad ?? 0,
			female: distribucionGenero?.femeninoCantidad ?? 0,
			malePercent: distribucionGenero?.masculinoPorc ?? 0,
			femalePercent: distribucionGenero?.femeninoPorc ?? 0,
		}),
		[distribucionGenero]
	);

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

	const isMunicipalityRole = roleConfig.role === "municipality";
	const clickableProvinceIds: number[] | "all" =
		roleConfig.role === "coa"
			? "all"
			: roleConfig.role === "province" && roleConfig.provinciaId
				? [roleConfig.provinciaId]
				: [];
	const showMunicipiosChart = isMunicipalityRole || provinciaDrill !== null;

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<div className="flex-1 flex flex-col p-4 gap-3">
				<div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
					<KpiCard
						title="Total de evaluaciones"
						value={resumen ? resumenData.evaluacionesTotales : "—"}
						subtitle={
							resumen ? (
								<span>
									<TrendIndicator value={resumen.evaluacionesVsAnteriorPct} />{" "}
									vs año anterior
								</span>
							) : (
								<span>Sin datos disponibles</span>
							)
						}
						icon={<ClipboardCheck className="h-5 w-5" />}
					/>

					<KpiCard
						title="Instituciones Alcanzadas"
						value={resumen ? resumenData.clubesAlcanzados : "—"}
						subtitle={
							resumen ? (
								<span>
									<TrendIndicator value={resumen.clubesAlcanzadosVsAnteriorPct} />{" "}
									vs año anterior
								</span>
							) : (
								<span>Sin datos disponibles</span>
							)
						}
						icon={<BookUser className="h-5 w-5" />}
					/>

					<KpiCard
						title={`Personas evaluadas en ${resumenData.añoActual || ""}`}
						value={resumen ? resumenData.personasEvaluadasAño : "—"}
						subtitle={
							resumen ? (
								<span>
									<TrendIndicator value={resumenData.personasVsAnteiorAñoPct} />{" "}
									vs {resumenData.añoAnterior}
								</span>
							) : (
								<span>Sin datos disponibles</span>
							)
						}
						icon={<Users className="h-5 w-5" />}
					/>

					<KpiCard
						title="Municipios participantes"
						value={resumen ? resumenData.municipiosAlcanzados : "—"}
						subtitle={
							resumen ? (
								<span>
									de <span className="font-bold text-primary h-4 w-4">{resumenData.totalMunicipios.toLocaleString("es-AR")}</span> en {scopeDisplayName}
								</span>
							) : (
								<span>Sin datos disponibles</span>
							)
						}
						icon={<MapPinHouse className="h-5 w-5" />}
					/>
				</div>

<div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
					{showMunicipiosChart ? (
						<MunicipiosEvaluacionesChart
							data={municipiosComparativa}
							provinciaNombre={provinciaDrill?.nombre}
							onBack={!isMunicipalityRole ? () => setProvinciaDrill(null) : undefined}
							height={360}
							className="mt-1"
						/>
					) : (
						<ProvinceComparisonChart
							data={provinciasComparativa}
							clickableProvinceIds={clickableProvinceIds}
							onProvinceClick={(provincia) =>
								setProvinciaDrill({ id: provincia.id_provincia, nombre: provincia.nombre })
							}
							height={360}
							className="mt-1"
						/>
					)}
					<MonthlyEvaluationsChart
						data={evolucionMensual}
						height={360}
						className="mt-1"
					/>
				</div>

				<div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-2">
					<ChartCakeNiveles
						data={nivelesEvaluados}
						height={360}
						className="mt-1"
					/>
					<GenderDistributionChart
						data={evaluacionesGenderDistribution}
						subtitle="Porcenjes de evaluados por género"
					/>
				</div>
			</div>
		</div>
	);
}

export default Evaluaciones;
