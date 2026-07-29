import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mars, Search, Venus, Gauge, IdCardLanyard } from "lucide-react";
import { authBootstrap, getAuthMe, sendLogoutOnPageClose } from "../api/session";
import type { AuthScope } from "../types/auth";
import type { UserRoleConfig } from "../data/roles";
import SearchableSelect from "../components/SearchableSelect";
import type { SearchableSelectOption } from "../components/SearchableSelect";
import SearchableMultiSelect from "../components/SearchableMultiSelect";
import RadarBiotipoChart, { BIOTIPO_AXES } from "../components/RadarBiotipoChart";
import { getDeportesPorScope, getMunicipiosClubesPorScope, getProvinciasPorScope } from "../data/statsApi";
import { getDeportistasBiotipo } from "../data/evaluacionesApi";
import type { DeportistasBiotipoResponse } from "../types/Evaluaciones";

type Genero = "masculino" | "femenino";

interface GeneroOption {
	value: Genero;
	label: string;
	color: string;
	icon: typeof Mars;
}

const GENERO_OPTIONS: GeneroOption[] = [
	{ value: "masculino", label: "Masculino", color: "#3b82f6", icon: Mars },
	{ value: "femenino", label: "Femenino", color: "#ec4899", icon: Venus },
];

const APTITUD_COLORS = [
	"#2563eb",
	"#16a34a",
	"#d97706",
	"#dc2626",
	"#7c3aed",
	"#0891b2",
	"#db2777",
];

const EDAD_MIN_LIMITE = 4;
const EDAD_MAX_LIMITE = 99;

const mapScopeToRoleConfig = (scope: AuthScope): UserRoleConfig => {
	switch (scope.role) {
		case "coa":
			return { role: "coa" };
		case "province":
			return { role: "province", provinciaId: scope.provinciaId ?? undefined };
		case "municipality":
			return {
				role: "municipality",
				provinciaId: scope.provinciaId ?? undefined,
				municipioId: scope.municipioId ?? undefined,
			};
		case "club":
			return { role: "club", clubId: scope.clubId ?? undefined };
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

function AlertaBiotipo() {
	const navigate = useNavigate();
	const [roleConfig, setRoleConfig] = useState<UserRoleConfig | null>(null);
	const [authStatus, setAuthStatus] = useState<"loading" | "ready" | "error">("loading");

	const [provinciaOptions, setProvinciaOptions] = useState<SearchableSelectOption[]>([]);
	const [deporteOptions, setDeporteOptions] = useState<SearchableSelectOption[]>([]);
	const [clubOptions, setClubOptions] = useState<SearchableSelectOption[]>([]);
	const [municipioOptions, setMunicipioOptions] = useState<SearchableSelectOption[]>([]);

	const [provinciasLoading, setProvinciasLoading] = useState(false);
	const [deportesLoading, setDeportesLoading] = useState(false);
	const [dependentOptionsLoading, setDependentOptionsLoading] = useState(false);

	const [provinciaId, setProvinciaId] = useState<string | null>(null);
	const [deporteIds, setDeporteIds] = useState<string[]>([]);
	const [edadMin, setEdadMin] = useState<string>("");
	const [edadMax, setEdadMax] = useState<string>("");
	const [genero, setGenero] = useState<Genero | null>(null);
	const [clubId, setClubId] = useState<string | null>(null);
	const [municipio, setMunicipio] = useState<string | null>(null);

	const [view, setView] = useState<"form" | "resultados">("form");
	const [resultados, setResultados] = useState<DeportistasBiotipoResponse | null>(null);
	const [selectedDeportistaId, setSelectedDeportistaId] = useState<number | null>(null);
	const [searchLoading, setSearchLoading] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);
	const searchAbortRef = useRef<AbortController | null>(null);

	const chartCardRef = useRef<HTMLDivElement>(null);
	const [rankingCardHeight, setRankingCardHeight] = useState<number | null>(null);

	useLayoutEffect(() => {
		if (view !== "resultados" || !resultados) {
			setRankingCardHeight(null);
			return;
		}

		const el = chartCardRef.current;
		if (!el) return;

		const lgMediaQuery = window.matchMedia("(min-width: 1024px)");

		const syncHeight = () => {
			setRankingCardHeight(lgMediaQuery.matches ? el.getBoundingClientRect().height : null);
		};

		const resizeObserver = new ResizeObserver(syncHeight);
		resizeObserver.observe(el);
		lgMediaQuery.addEventListener("change", syncHeight);
		syncHeight();

		return () => {
			resizeObserver.disconnect();
			lgMediaQuery.removeEventListener("change", syncHeight);
		};
	}, [view, resultados]);

	const esMultiDeporte = deporteIds.length > 1;
	const dependentFieldsEnabled = Boolean(provinciaId && deporteIds.length === 1);
	const dependentOptionsDisabledHint = esMultiDeporte
		? "Deshabilitado al seleccionar varios deportes"
		: !dependentFieldsEnabled
			? "Seleccioná provincia y un deporte primero"
			: dependentOptionsLoading
				? "Cargando clubes y municipios..."
				: undefined;

	const edadMinValue = edadMin === "" ? null : Number(edadMin);
	const edadMaxValue = edadMax === "" ? null : Number(edadMax);
	const edadRangoInvalido =
		edadMinValue !== null && edadMaxValue !== null && edadMinValue > edadMaxValue;

	const isFormValid = useMemo(() => {
		return Boolean(
			provinciaId &&
			deporteIds.length > 0 &&
			edadMinValue !== null &&
			edadMaxValue !== null &&
			!edadRangoInvalido
		);
	}, [provinciaId, deporteIds, edadMinValue, edadMaxValue, edadRangoInvalido]);

	const handleProvinciaChange = useCallback((value: string | null) => {
		setProvinciaId(value);
		setClubId(null);
		setMunicipio(null);
	}, []);

	const handleDeportesChange = useCallback((values: string[]) => {
		setDeporteIds(values);
		setClubId(null);
		setMunicipio(null);
	}, []);

	const handleGeneroToggle = useCallback((value: Genero) => {
		setGenero((prev) => (prev === value ? null : value));
	}, []);

	const isAbortError = useCallback((error: unknown): boolean => {
		if (error instanceof DOMException && error.name === "AbortError") return true;
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
		return () => { active = false; controller.abort(); };
	}, [isAbortError]);

	useEffect(() => {
		if (authStatus !== "ready") return;
		const handlePageHide = () => { sendLogoutOnPageClose(); };
		window.addEventListener("pagehide", handlePageHide);
		return () => { window.removeEventListener("pagehide", handlePageHide); };
	}, [authStatus]);

	useEffect(() => {
		if (authStatus !== "ready") return;
		const controller = new AbortController();
		let active = true;

		const fetchProvincias = async () => {
			setProvinciasLoading(true);
			try {
				const provincias = await getProvinciasPorScope(controller.signal);
				if (!active) return;
				setProvinciaOptions(provincias.map((p) => ({ value: String(p.id_provincia), label: p.nombre })));
			} catch (error) {
				if (!active || isAbortError(error)) return;
				setProvinciaOptions([]);
			} finally {
				if (active) setProvinciasLoading(false);
			}
		};

		void fetchProvincias();
		return () => { active = false; controller.abort(); };
	}, [authStatus, isAbortError]);

	useEffect(() => {
		if (authStatus !== "ready") return;
		const controller = new AbortController();
		let active = true;

		const fetchDeportes = async () => {
			setDeportesLoading(true);
			try {
				const deportes = await getDeportesPorScope(controller.signal);
				if (!active) return;
				setDeporteOptions(deportes.map((d) => ({ value: String(d.id_deporte), label: d.nombre })));
			} catch (error) {
				if (!active || isAbortError(error)) return;
				setDeporteOptions([]);
			} finally {
				if (active) setDeportesLoading(false);
			}
		};

		void fetchDeportes();
		return () => { active = false; controller.abort(); };
	}, [authStatus, isAbortError]);

	useEffect(() => {
		if (authStatus !== "ready" || !provinciaId || deporteIds.length !== 1) {
			setClubOptions([]);
			setMunicipioOptions([]);
			return;
		}

		const controller = new AbortController();
		let active = true;

		const fetchMunicipiosClubes = async () => {
			setDependentOptionsLoading(true);
			try {
				const { municipios, clubes } = await getMunicipiosClubesPorScope(
					Number(provinciaId),
					Number(deporteIds[0]),
					controller.signal
				);
				if (!active) return;
				setClubOptions(clubes.map((c) => ({ value: String(c.id), label: c.nombre })));
				setMunicipioOptions(municipios.map((m) => ({ value: String(m.id), label: m.nombre })));
			} catch (error) {
				if (!active || isAbortError(error)) return;
				setClubOptions([]);
				setMunicipioOptions([]);
			} finally {
				if (active) setDependentOptionsLoading(false);
			}
		};

		void fetchMunicipiosClubes();
		return () => { active = false; controller.abort(); };
	}, [authStatus, provinciaId, deporteIds, isAbortError]);

	useEffect(() => {
		return () => { searchAbortRef.current?.abort(); };
	}, []);

	const handleSubmitBusqueda = useCallback(
		async (event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();
			if (!isFormValid) return;

			searchAbortRef.current?.abort();
			const controller = new AbortController();
			searchAbortRef.current = controller;

			setSearchLoading(true);
			setSearchError(null);

			try {
				const esUnicoDeporte = deporteIds.length === 1;
				const data = await getDeportistasBiotipo(
					{
						idDeporte: esUnicoDeporte ? Number(deporteIds[0]) : deporteIds.map(Number),
						idProvincia: Number(provinciaId),
						edadMin: edadMinValue as number,
						edadMax: edadMaxValue as number,
						genero: genero === "masculino" ? "M" : genero === "femenino" ? "F" : undefined,
						idClub: esUnicoDeporte && clubId ? Number(clubId) : undefined,
						idMunicipio: esUnicoDeporte && municipio ? Number(municipio) : undefined,
					},
					controller.signal
				);

				if (controller.signal.aborted) return;

				setResultados(data);
				const sorted = [...data.deportistas].sort((a, b) =>
					a.nombre.localeCompare(b.nombre, "es")
				);
				setSelectedDeportistaId(sorted[0]?.idDeportista ?? null);
				setView("resultados");
			} catch (error) {
				if (isAbortError(error)) return;
				setSearchError(error instanceof Error ? error.message : "No se pudo completar la búsqueda.");
			} finally {
				if (!controller.signal.aborted) setSearchLoading(false);
			}
		},
		[isFormValid, deporteIds, provinciaId, edadMinValue, edadMaxValue, genero, clubId, municipio, isAbortError]
	);

	const handleVolverABusqueda = useCallback(() => { setView("form"); }, []);
	const handleClose = useCallback(() => { navigate("/"); }, [navigate]);

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

	if (view === "resultados" && resultados) {
		const alphabetical = [...resultados.deportistas].sort((a, b) =>
			a.nombre.localeCompare(b.nombre, "es")
		);

		if (alphabetical.length === 0) {
			return (
				<div className="min-h-screen bg-background">
					<div className="fixed inset-0 z-40 bg-background/55 backdrop-blur-sm" onClick={handleClose} />
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
						<div
							className="spring-open relative flex w-full max-w-md flex-col items-center gap-4 overflow-hidden rounded-xl border border-border bg-card p-6 text-center shadow-2xl"
							style={{ background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--surface-elevated)) 100%)" }}
							onClick={(event) => event.stopPropagation()}
						>
							<div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-primary" />
							<div className="absolute left-0 top-0 h-1 w-full rounded-t-xl bg-primary" />
							<div className="rounded-lg bg-primary/10 p-3 text-primary">
								<Gauge className="h-6 w-6" />
							</div>
							<p className="text-sm text-muted-foreground">
								No se encontraron deportistas con los filtros seleccionados.
							</p>
							<button
								type="button"
								onClick={handleVolverABusqueda}
								className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
							>
								<ArrowLeft className="h-4 w-4" />
								Volver a la búsqueda
							</button>
						</div>
					</div>
				</div>
			);
		}

		const selectedDeportista = alphabetical.find((d) => d.idDeportista === selectedDeportistaId) ?? null;

		const filtrosAplicados = [
			{ label: "Provincia", value: provinciaOptions.find((o) => o.value === provinciaId)?.label },
			{
				label: deporteIds.length > 1 ? "Deportes" : "Deporte",
				value: deporteOptions
					.filter((o) => deporteIds.includes(o.value))
					.map((o) => o.label)
					.join(", ") || undefined,
			},
			{ label: "Edad", value: edadMin && edadMax ? `${edadMin} a ${edadMax} años` : undefined },
			{ label: "Género", value: genero ? GENERO_OPTIONS.find((o) => o.value === genero)?.label : undefined },
			{ label: "Club", value: clubId ? clubOptions.find((o) => o.value === clubId)?.label : undefined },
			{ label: "Municipio", value: municipio ? municipioOptions.find((o) => o.value === municipio)?.label : undefined },
		].filter((f): f is { label: string; value: string } => Boolean(f.value));

		const testsByName = new Map(selectedDeportista?.tests.map((t) => [t.nombre, t]) ?? []);
		const comparacionTests = selectedDeportista
			? BIOTIPO_AXES.map((nombre) => {
				const t = testsByName.get(nombre);
				return { test: nombre, percentil: t?.percentil ?? null };
			})
			: [];

		return (
			<div className="min-h-screen bg-background flex flex-col">
				<div className="flex items-center justify-between gap-2 border-b border-border px-3 py-3 sm:gap-3 sm:px-6">
					<div className="flex items-center gap-2 min-w-0 sm:gap-3">
						<button
							type="button"
							onClick={handleVolverABusqueda}
							aria-label="Volver a la búsqueda"
							className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground shrink-0 sm:px-2.5"
						>
							<ArrowLeft className="h-4 w-4" />
							<span className="hidden sm:inline">Volver a la búsqueda</span>
						</button>
						<div className="hidden h-6 w-px bg-border shrink-0 sm:block" />
						<div className="hidden rounded-lg bg-primary/10 p-2 text-primary shrink-0 sm:flex">
							<Gauge className="h-5 w-5" />
						</div>
						<div className="min-w-0">
							<h1 className="text-base font-semibold text-foreground truncate sm:text-lg">Alerta Biotipo</h1>
							<p className="truncate text-xs text-muted-foreground sm:text-sm">
								Análisis de aptitudes físicas por biotipo.{" "}
								<span className="font-semibold text-primary">{alphabetical.length}</span>{" "}
								{alphabetical.length === 1 ? "deportista encontrado" : "deportistas encontrados"}
							</p>
						</div>
					</div>
				</div>

				<div className="flex-1 flex flex-col p-3 gap-3 sm:p-4 min-h-0">
					<div className="flex-1 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] lg:items-start min-h-0">
						<div ref={chartCardRef} className="flex flex-col rounded-xl border border-border bg-card p-4">
							<div className="flex items-center mb-1 shrink-0">
								<IdCardLanyard className="h-6 w-6 mr-2 text-primary font-bold shrink-0" />
								{selectedDeportista ? (
									<h3 className="text-sm font-semibold text-foreground truncate">
										{selectedDeportista.nombre}{" "}
										<span className="font-normal text-muted-foreground">| {selectedDeportista.club}</span>
									</h3>
								) : (
									<p className="text-sm text-muted-foreground">Seleccioná un deportista de la tabla</p>
								)}
							</div>
							<p className="text-xs text-muted-foreground mb-1 shrink-0">
								Comparativa de los tests evaluados frente a la mediana del grupo filtrado.
							</p>

							<div className="h-72 lg:h-96 shrink-0">
								<RadarBiotipoChart
									tests={selectedDeportista?.tests ?? []}
									medianas={resultados.medianas}
									height="100%"
								/>
							</div>

							<p className="text-xs text-muted-foreground mt-1 leading-5 shrink-0">
								La línea punteada indica la mediana general. Activá o desactivá las referencias del gráfico para ver solo el deportista o solo la mediana.
							</p>

							{(filtrosAplicados.length > 0 || comparacionTests.length > 0) && (
								<div className="mt-3">
									{filtrosAplicados.length > 0 && (
										<div className="border-t border-border/60 pt-3">
											<p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
												Filtros aplicados
											</p>
											<div className="flex flex-wrap gap-1.5">
												{filtrosAplicados.map((filtro) => (
													<span
														key={filtro.label}
														className="rounded-full border border-primary/70 bg-muted/40 px-2 py-1 text-xs text-foreground"
													>
														<span className="text-muted-foreground">{filtro.label}: </span>
														{filtro.value}
													</span>
												))}
											</div>
										</div>
									)}

									{comparacionTests.length > 0 && (
										<div className="border-t border-border/60 pt-3 mt-3">
											<p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
												Percentil del deportista en cada test
											</p>
											<div className="space-y-1">
												{comparacionTests.map(({ test, percentil }, index) => {
													const testColor = APTITUD_COLORS[index % APTITUD_COLORS.length];
													const display = percentil !== null ? 100 - percentil : null;
													const isGood = percentil !== null && percentil >= 50;

													return (
														<div
															key={test}
															className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-2 py-1 text-xs"
														>
															<span className="flex items-center gap-1.5 truncate text-foreground">
																<span
																	className="h-2 w-2 shrink-0 rounded-full"
																	style={{ backgroundColor: testColor }}
																/>
																{test}
															</span>
															{display !== null ? (
																isGood ? (
																	<span className="shrink-0 font-semibold tabular-nums text-green-600">
																		Top {display}%
																	</span>
																) : (
																	<span className="shrink-0 font-semibold tabular-nums text-orange-500">
																		Área de mejora {display}%
																	</span>
																)
															) : (
																<span className="shrink-0 text-muted-foreground">—</span>
															)}
														</div>
													);
												})}
											</div>
										</div>
									)}
								</div>
							)}
						</div>

						<div
							className="flex flex-col rounded-xl border border-border bg-card overflow-hidden h-[34rem] lg:h-auto"
							style={rankingCardHeight !== null ? { height: rankingCardHeight } : undefined}
						>
							<div className="border-b border-border px-4 py-3 shrink-0">
								<h3 className="text-sm font-semibold text-foreground">Deportistas</h3>
							</div>
							<div className="flex-1 overflow-y-auto overflow-x-auto">
								<table className="w-full text-sm">
									<thead className="sticky top-0 z-10 bg-muted/30">
										<tr className="bg-muted/30 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
											<th className="py-2.5 px-4 font-medium">Deportista</th>
											<th className="py-2.5 px-2 font-medium whitespace-nowrap">Edad / Sexo</th>
											<th className="py-2.5 px-2 font-medium">Provincia</th>
											<th className="py-2.5 px-2 font-medium">Municipio</th>
											<th className="py-2.5 px-4 font-medium">Deporte</th>
										</tr>
									</thead>
									<tbody>
										{alphabetical.map((deportista) => {
											const isSelected = deportista.idDeportista === selectedDeportistaId;
											const isMale = deportista.genero?.toUpperCase().startsWith("M");
											const GeneroIcon = isMale ? Mars : Venus;
											const generoColor = isMale ? "#3b82f6" : "#ec4899";

											return (
												<tr
													key={deportista.idDeportista}
													onClick={() => setSelectedDeportistaId(deportista.idDeportista)}
													className={`cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-muted/40 ${isSelected ? "bg-primary/10" : ""}`}
													style={isSelected ? { boxShadow: "inset 3px 0 0 0 hsl(var(--primary))" } : undefined}
												>
													<td className="py-2.5 px-4">
														<p className="font-semibold text-foreground">{deportista.nombre}</p>
														<p className="text-xs text-muted-foreground">{deportista.club}</p>
													</td>
													<td className="py-2.5 px-2 whitespace-nowrap">
														<span className="text-foreground">{deportista.edad}</span>
														<GeneroIcon className="ml-1 inline h-4 w-4" style={{ color: generoColor }} />
													</td>
													<td className="py-2.5 px-2 text-muted-foreground">{deportista.provincia}</td>
													<td className="py-2.5 px-2 text-muted-foreground">{deportista.municipio}</td>
													<td className="py-2.5 px-4 text-muted-foreground">{deportista.deporte}</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="fixed inset-0 z-40 bg-background/55 backdrop-blur-sm" onClick={handleClose} />

			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div
					className="spring-open relative flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl max-h-[92vh]"
					style={{ background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--surface-elevated)) 100%)" }}
					onClick={(event) => event.stopPropagation()}
				>
					<div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-primary" />
					<div className="absolute left-0 top-0 h-1 w-full rounded-t-xl bg-primary" />

					<div className="flex items-start justify-between gap-2 px-5 pt-5 pb-3 shrink-0">
						<div className="flex items-center gap-3 pr-2">
							<div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
								<Gauge className="h-5 w-5" />
							</div>
							<div>
								<h2 className="text-lg font-semibold text-foreground">Alerta Biotipo</h2>
								<p className="text-xs text-muted-foreground mt-0.5">Completá el formulario para analizar el biotipo del grupo</p>
							</div>
						</div>
					</div>

					<form className="flex flex-1 flex-col overflow-hidden" onSubmit={handleSubmitBusqueda}>
						<div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<SearchableSelect
									label="Provincia"
									required
									options={provinciaOptions}
									value={provinciaId}
									onChange={handleProvinciaChange}
									disabled={provinciasLoading}
									disabledHint={provinciasLoading ? "Cargando provincias..." : undefined}
									placeholder="Seleccionar provincia"
									searchPlaceholder="Buscar provincia..."
									emptyMessage="No se encontraron provincias."
								/>
								<SearchableMultiSelect
									label="Deporte"
									required
									options={deporteOptions}
									values={deporteIds}
									onChange={handleDeportesChange}
									disabled={deportesLoading}
									disabledHint={deportesLoading ? "Cargando deportes..." : undefined}
									placeholder="Seleccionar deporte(s)"
									searchPlaceholder="Buscar deporte..."
									emptyMessage="No se encontraron deportes."
								/>
							</div>

							<div>
								<span className="text-sm font-medium text-foreground">
									Rango de edad
									<span className="ml-0.5 text-destructive">*</span>
								</span>
								<div className="mt-1.5 grid grid-cols-2 gap-4">
									<div className="flex flex-col gap-1.5">
										<label htmlFor="edad-min" className="text-xs text-muted-foreground">
											Edad mínima
										</label>
										<input
											id="edad-min"
											type="number"
											inputMode="numeric"
											min={EDAD_MIN_LIMITE}
											max={EDAD_MAX_LIMITE}
											value={edadMin}
											onChange={(event) => setEdadMin(event.target.value)}
											placeholder="Ej. 8"
											aria-invalid={edadRangoInvalido}
											className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${edadRangoInvalido ? "border-destructive" : "border-input"}`}
										/>
									</div>
									<div className="flex flex-col gap-1.5">
										<label htmlFor="edad-max" className="text-xs text-muted-foreground">
											Edad máxima
										</label>
										<input
											id="edad-max"
											type="number"
											inputMode="numeric"
											min={EDAD_MIN_LIMITE}
											max={EDAD_MAX_LIMITE}
											value={edadMax}
											onChange={(event) => setEdadMax(event.target.value)}
											placeholder="Ej. 16"
											aria-invalid={edadRangoInvalido}
											className={`w-full rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${edadRangoInvalido ? "border-destructive" : "border-input"}`}
										/>
									</div>
								</div>
								{edadRangoInvalido && (
									<p className="mt-1.5 text-xs text-destructive">
										La edad mínima no puede ser mayor que la edad máxima.
									</p>
								)}
							</div>

							<div>
								<span className="text-sm font-medium text-foreground">Género</span>
								<div className="mt-1.5 flex flex-wrap gap-1.5" role="group" aria-label="Género">
									{GENERO_OPTIONS.map((option) => {
										const checked = genero === option.value;
										const Icon = option.icon;
										return (
											<button
												key={option.value}
												type="button"
												onClick={() => handleGeneroToggle(option.value)}
												aria-pressed={checked}
												className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 transition-all whitespace-nowrap flex-shrink-0 text-sm ${checked ? "text-foreground shadow-sm" : "border-border/70 bg-background/70 hover:bg-muted/40"}`}
												style={
													checked
														? {
															borderColor: option.color,
															backgroundColor: `${option.color}14`,
															boxShadow: `0 0 0 1px ${option.color}40 inset`,
														}
														: undefined
												}
											>
												<Icon className="h-3 w-3 flex-shrink-0" style={{ color: option.color }} />
												<span className={checked ? "font-semibold" : ""} style={checked ? { color: option.color } : undefined}>
													{option.label}
												</span>
											</button>
										);
									})}
								</div>
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<SearchableSelect
									label="Club"
									options={clubOptions}
									value={clubId}
									onChange={setClubId}
									disabled={!dependentFieldsEnabled || dependentOptionsLoading}
									disabledHint={dependentOptionsDisabledHint}
									placeholder="Seleccionar club"
									searchPlaceholder="Buscar club..."
									emptyMessage="No se encontraron clubes."
								/>
								<SearchableSelect
									label="Municipio"
									options={municipioOptions}
									value={municipio}
									onChange={setMunicipio}
									disabled={!dependentFieldsEnabled || dependentOptionsLoading}
									disabledHint={dependentOptionsDisabledHint}
									placeholder="Seleccionar municipio"
									searchPlaceholder="Buscar municipio..."
									emptyMessage="No se encontraron municipios."
								/>
							</div>
						</div>

						<div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-4">
							{searchError ? (
								<p className="text-xs text-destructive">{searchError}</p>
							) : (
								<span />
							)}
							<div className="flex items-center gap-3">
								<button
									type="submit"
									disabled={!isFormValid || searchLoading}
									className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary"
								>
									{searchLoading ? (
										<span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
									) : (
										<Search className="h-4 w-4" />
									)}
									Analizar biotipo
								</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}

export default AlertaBiotipo;
