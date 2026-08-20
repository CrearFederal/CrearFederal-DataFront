import { useCallback, useEffect, useMemo, useState } from "react";
import {
	AlertTriangle,
	ArrowDownUp,
	Building2,
	GraduationCap,
	Laptop,
	Search,
	Timer,
	UserCheck,
	Users,
	X,
} from "lucide-react";

import { authBootstrap, getAuthMe, sendLogoutOnPageClose } from "../api/session";
import {
	getCapacitaciones,
	getCapacitacionesDistribuciones,
	getCapacitacionesOpcionesFiltro,
	getCapacitacionesResumen,
	USE_MOCK_CAPACITACIONES,
} from "../data/capacitacionesApi";
import type { AuthScope } from "../types/auth";
import type { UserRoleConfig } from "../data/roles";
import type {
	Capacitacion,
	CapacitacionesDistribuciones,
	CapacitacionesFiltros,
	CapacitacionesOpcionesFiltro,
	CapacitacionesResumen,
} from "../types/Capacitaciones";
import KpiCard from "../components/KpiCard";
import SearchableSelect from "../components/SearchableSelect";
import {
	CapacitacionesMensualChart,
	ConteoBarChart,
	ConteoRadialChart,
	ConteoStackedBar,
} from "../components/ChartsCapacitaciones";

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

const isAbortError = (error: unknown): boolean => {
	if (error instanceof DOMException && error.name === "AbortError") return true;

	if (typeof error === "object" && error !== null) {
		const err = error as { name?: string; code?: string };
		return err.name === "CanceledError" || err.code === "ERR_CANCELED";
	}

	return false;
};

const formatFecha = (fecha: string | null): string => {
	if (!fecha) return "—";
	const [anio, mes, dia] = fecha.split("-");
	return `${dia}/${mes}/${anio}`;
};

const opcionesDe = (valores: string[]) => valores.map((valor) => ({ value: valor, label: valor }));

type ColumnaOrden = "nombre" | "categoria" | "fechaInicio" | "duracionHoras" | "totalAsistentes";

const emptyDistribuciones: CapacitacionesDistribuciones = {
	porCategoria: [],
	porModalidad: [],
	porTipoOrganizador: [],
	porMes: [],
	porGenero: [],
	porTipoAsistente: [],
	porRangoEtario: [],
};

function Capacitaciones() {
	const [roleConfig, setRoleConfig] = useState<UserRoleConfig | null>(null);
	const [authStatus, setAuthStatus] = useState<"loading" | "ready" | "error">("loading");

	const [categoria, setCategoria] = useState<string | null>(null);
	const [modalidad, setModalidad] = useState<string | null>(null);
	const [tipoOrganizador, setTipoOrganizador] = useState<string | null>(null);
	const [busqueda, setBusqueda] = useState("");
	const [busquedaAplicada, setBusquedaAplicada] = useState("");

	const [opciones, setOpciones] = useState<CapacitacionesOpcionesFiltro>({
		categorias: [],
		modalidades: [],
		tiposOrganizador: [],
	});
	const [resumen, setResumen] = useState<CapacitacionesResumen | null>(null);
	const [distribuciones, setDistribuciones] = useState<CapacitacionesDistribuciones>(emptyDistribuciones);
	const [listado, setListado] = useState<Capacitacion[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [errorDatos, setErrorDatos] = useState<string | null>(null);

	const [orden, setOrden] = useState<{ columna: ColumnaOrden; asc: boolean }>({
		columna: "fechaInicio",
		asc: false,
	});

	// -------- Auth bootstrap (mismo patrón que Infraestructura.tsx)
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
	}, []);

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

	// -------- Opciones de filtro (una sola vez)
	useEffect(() => {
		if (authStatus !== "ready") return;

		const controller = new AbortController();

		const loadOpciones = async () => {
			try {
				const data = await getCapacitacionesOpcionesFiltro(controller.signal);
				if (!controller.signal.aborted) setOpciones(data);
			} catch (error) {
				if (!isAbortError(error)) {
					setOpciones({ categorias: [], modalidades: [], tiposOrganizador: [] });
				}
			}
		};

		void loadOpciones();

		return () => controller.abort();
	}, [authStatus]);

	const filtros: CapacitacionesFiltros = useMemo(
		() => ({
			categoria,
			modalidad,
			tipoOrganizador,
			busqueda: busquedaAplicada || null,
		}),
		[categoria, modalidad, tipoOrganizador, busquedaAplicada]
	);

	// -------- Datos de la sección (se recargan con cada cambio de filtro)
	useEffect(() => {
		if (authStatus !== "ready") return;

		const controller = new AbortController();

		const loadDatos = async () => {
			setIsLoading(true);
			setErrorDatos(null);

			try {
				const [resumenData, distribucionesData, listadoData] = await Promise.all([
					getCapacitacionesResumen(filtros, controller.signal),
					getCapacitacionesDistribuciones(filtros, controller.signal),
					getCapacitaciones(filtros, controller.signal),
				]);

				if (controller.signal.aborted) return;

				setResumen(resumenData);
				setDistribuciones(distribucionesData);
				setListado(listadoData);
			} catch (error) {
				if (isAbortError(error) || controller.signal.aborted) return;

				setResumen(null);
				setDistribuciones(emptyDistribuciones);
				setListado([]);
				setErrorDatos(
					error instanceof Error ? error.message : "No se pudieron cargar las capacitaciones."
				);
			} finally {
				if (!controller.signal.aborted) setIsLoading(false);
			}
		};

		void loadDatos();

		return () => controller.abort();
	}, [authStatus, filtros]);

	const hayFiltros = Boolean(categoria || modalidad || tipoOrganizador || busquedaAplicada);

	const limpiarFiltros = useCallback(() => {
		setCategoria(null);
		setModalidad(null);
		setTipoOrganizador(null);
		setBusqueda("");
		setBusquedaAplicada("");
	}, []);

	const toggleOrden = useCallback((columna: ColumnaOrden) => {
		setOrden((previo) =>
			previo.columna === columna ? { columna, asc: !previo.asc } : { columna, asc: false }
		);
	}, []);

	const listadoOrdenado = useMemo(() => {
		const factor = orden.asc ? 1 : -1;

		return [...listado].sort((a, b) => {
			switch (orden.columna) {
				case "nombre":
					return factor * a.nombre.localeCompare(b.nombre, "es");
				case "categoria":
					return factor * a.categoria.localeCompare(b.categoria, "es");
				case "duracionHoras":
					return factor * (a.duracionHoras - b.duracionHoras);
				case "totalAsistentes":
					return factor * (a.totalAsistentes - b.totalAsistentes);
				case "fechaInicio":
				default:
					return factor * (a.fechaInicio ?? "").localeCompare(b.fechaInicio ?? "");
			}
		});
	}, [listado, orden]);

	const periodo = useMemo(() => {
		const fechas = listado
			.map((item) => item.fechaInicio)
			.filter((fecha): fecha is string => Boolean(fecha))
			.sort();

		if (fechas.length === 0) return null;
		return { desde: fechas[0], hasta: fechas[fechas.length - 1] };
	}, [listado]);

	const alcanceTerritorial = useMemo(() => {
		const municipios = new Set(
			listado.map((item) => item.municipio).filter((item): item is string => Boolean(item))
		);
		const provincias = new Set(
			listado.map((item) => item.provincia).filter((item): item is string => Boolean(item))
		);

		return { municipios: municipios.size, provincias: [...provincias] };
	}, [listado]);

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

	const encabezado = (columna: ColumnaOrden, etiqueta: string, alineacion = "text-left") => (
		<th className={`px-4 py-2 font-medium ${alineacion}`}>
			<button
				type="button"
				onClick={() => toggleOrden(columna)}
				className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
					orden.columna === columna ? "text-foreground" : ""
				}`}
			>
				{etiqueta}
				<ArrowDownUp className="h-3 w-3 opacity-60" />
			</button>
		</th>
	);

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<div className="flex-1 flex flex-col p-4 gap-3">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div>
						<h1 className="text-lg font-semibold text-foreground">Capacitaciones</h1>
						<p className="text-sm text-muted-foreground">
							Qué se capacita, quién lo organiza y a quiénes llega
							{periodo ? ` · ${formatFecha(periodo.desde)} a ${formatFecha(periodo.hasta)}` : ""}
							{alcanceTerritorial.provincias.length === 1
								? ` · ${alcanceTerritorial.provincias[0]}`
								: ""}
						</p>
					</div>

					{USE_MOCK_CAPACITACIONES && (
						<span className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700">
							<AlertTriangle className="h-3.5 w-3.5" />
							Datos simulados — la API todavía no tiene carga
						</span>
					)}
				</div>

				{/* -------- Filtros */}
				<div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3">
					<div className="min-w-[240px] flex-1 max-w-sm">
						<SearchableSelect
							id="capacitaciones-categoria"
							label="Categoría"
							placeholder="Todas las categorías"
							options={opcionesDe(opciones.categorias)}
							value={categoria}
							onChange={setCategoria}
						/>
					</div>

					<div className="min-w-[160px]">
						<SearchableSelect
							id="capacitaciones-modalidad"
							label="Modalidad"
							placeholder="Todas"
							options={opcionesDe(opciones.modalidades)}
							value={modalidad}
							onChange={setModalidad}
						/>
					</div>

					<div className="min-w-[220px] flex-1 max-w-sm">
						<SearchableSelect
							id="capacitaciones-organizador"
							label="Tipo de organizador"
							placeholder="Todos"
							options={opcionesDe(opciones.tiposOrganizador)}
							value={tipoOrganizador}
							onChange={setTipoOrganizador}
						/>
					</div>

					<div className="min-w-[220px] flex-1">
						<label
							htmlFor="capacitaciones-busqueda"
							className="mb-1 block text-xs font-medium text-foreground"
						>
							Buscar
						</label>
						<div className="relative">
							<Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
							<input
								id="capacitaciones-busqueda"
								type="search"
								value={busqueda}
								onChange={(event) => setBusqueda(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === "Enter") setBusquedaAplicada(busqueda);
								}}
								onBlur={() => setBusquedaAplicada(busqueda)}
								placeholder="Nombre del evento u organizador..."
								className="w-full rounded-md border border-border bg-background py-2 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
							/>
						</div>
					</div>

					{hayFiltros && (
						<button
							type="button"
							onClick={limpiarFiltros}
							className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							<X className="h-3.5 w-3.5" />
							Limpiar filtros
						</button>
					)}
				</div>

				{errorDatos && (
					<div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						{errorDatos}
					</div>
				)}

				{/* -------- KPIs */}
				<div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
					<KpiCard
						title="Capacitaciones dictadas"
						value={resumen ? resumen.totalCapacitaciones : "—"}
						subtitle={
							resumen ? (
								<span>
									{resumen.organizadoresActivos.toLocaleString("es-AR")} organizadores distintos
								</span>
							) : (
								<span>Sin datos disponibles</span>
							)
						}
						icon={<GraduationCap className="h-5 w-5" />}
					/>

					<KpiCard
						title="Asistencias registradas"
						value={resumen ? resumen.totalAsistencias : "—"}
						subtitle={
							resumen ? (
								<span>
									promedio de{" "}
									<span className="font-bold text-primary">
										{resumen.promedioAsistentes.toLocaleString("es-AR")}
									</span>{" "}
									por capacitación
								</span>
							) : (
								<span>Sin datos disponibles</span>
							)
						}
						icon={<Users className="h-5 w-5" />}
					/>

					<KpiCard
						title="Personas alcanzadas"
						value={resumen ? resumen.personasUnicas : "—"}
						subtitle={
							resumen ? (
								<span>
									personas distintas
									{alcanceTerritorial.municipios > 0
										? ` · ${alcanceTerritorial.municipios} municipio${alcanceTerritorial.municipios === 1 ? "" : "s"} sede`
										: ""}
								</span>
							) : (
								<span>Sin datos disponibles</span>
							)
						}
						icon={<UserCheck className="h-5 w-5" />}
					/>

					<KpiCard
						title="Horas dictadas"
						value={resumen ? resumen.horasDictadas : "—"}
						subtitle={
							resumen && resumen.totalCapacitaciones > 0 ? (
								<span>
									{(resumen.horasDictadas / resumen.totalCapacitaciones).toLocaleString("es-AR", {
										maximumFractionDigits: 1,
									})}{" "}
									h promedio por capacitación
								</span>
							) : (
								<span>Sin datos disponibles</span>
							)
						}
						icon={<Timer className="h-5 w-5" />}
					/>
				</div>

				{/* -------- Gráficos */}
				<CapacitacionesMensualChart data={distribuciones.porMes} height={280} className="mt-1" />

				<div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
					<ConteoRadialChart
						title="Capacitaciones por categoría"
						subtitle="Ejes temáticos del plan"
						data={distribuciones.porCategoria}
						unidad="capacitaciones"
						icon={<GraduationCap className="h-4 w-4" />}
					/>
					<ConteoBarChart
						title="Quién organiza"
						subtitle="Tipo de organismo responsable del dictado"
						data={distribuciones.porTipoOrganizador}
						unidad="capacitaciones"
						color="#10b981"
						icon={<Building2 className="h-4 w-4" />}
						height={240}
						anchoEtiqueta={200}
					/>
				</div>

				<div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
					<ConteoStackedBar
						title="Modalidad de cursada"
						subtitle="Presencial, virtual o mixta"
						data={distribuciones.porModalidad}
						unidad="capacitaciones"
						icon={<Laptop className="h-4 w-4" />}
					/>
					<ConteoBarChart
						title="Perfil de los asistentes"
						subtitle="Rol declarado por quienes asistieron"
						data={distribuciones.porTipoAsistente}
						unidad="asistencias"
						color="#ec4899"
						icon={<UserCheck className="h-4 w-4" />}
						height={200}
						anchoEtiqueta={200}
					/>
				</div>

				{/* -------- Listado */}
				<div className="rounded-xl border border-border bg-card overflow-hidden">
					<div className="flex items-center justify-between px-4 py-3 border-b border-border">
						<h3 className="text-sm font-semibold text-foreground">Detalle de capacitaciones</h3>
						<span className="text-xs text-muted-foreground">
							{isLoading
								? "Cargando..."
								: `${listadoOrdenado.length} capacitación${listadoOrdenado.length === 1 ? "" : "es"}`}
						</span>
					</div>

					{listadoOrdenado.length === 0 && !isLoading ? (
						<p className="px-4 py-6 text-sm text-muted-foreground">
							No hay capacitaciones que coincidan con los filtros seleccionados.
						</p>
					) : (
						<div className="max-h-[520px] overflow-auto">
							<table className="w-full text-sm">
								<thead className="sticky top-0 bg-card">
									<tr className="border-b border-border text-left text-xs text-muted-foreground">
										{encabezado("nombre", "Capacitación")}
										{encabezado("categoria", "Categoría")}
										<th className="px-4 py-2 font-medium">Modalidad</th>
										<th className="px-4 py-2 font-medium">Organizador</th>
										{encabezado("fechaInicio", "Inicio")}
										{encabezado("duracionHoras", "Horas", "text-right")}
										{encabezado("totalAsistentes", "Asistentes", "text-right")}
									</tr>
								</thead>
								<tbody>
									{listadoOrdenado.map((capacitacion) => {
										const fechasInvertidas =
											capacitacion.fechaInicio &&
											capacitacion.fechaFin &&
											capacitacion.fechaFin < capacitacion.fechaInicio;

										const detalle =
											capacitacion.deporte ??
											capacitacion.subcategoria ??
											(capacitacion.idSubcategoria !== null
												? `Subcategoría #${capacitacion.idSubcategoria}`
												: null);

										return (
											<tr
												key={capacitacion.id}
												className="border-b border-border last:border-0 hover:bg-muted/50"
											>
												<td className="px-4 py-2">
													<div className="font-medium text-foreground">{capacitacion.nombre}</div>
													{detalle && (
														<div className="text-xs text-muted-foreground">{detalle}</div>
													)}
												</td>
												<td className="px-4 py-2 text-muted-foreground">{capacitacion.categoria}</td>
												<td className="px-4 py-2 text-muted-foreground">{capacitacion.modalidad}</td>
												<td className="px-4 py-2">
													<div className="text-foreground">{capacitacion.organizador ?? "—"}</div>
													{capacitacion.tipoOrganizador && (
														<div className="text-xs text-muted-foreground">
															{capacitacion.tipoOrganizador}
														</div>
													)}
												</td>
												<td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
													<span className="inline-flex items-center gap-1">
														{formatFecha(capacitacion.fechaInicio)}
														{fechasInvertidas && (
															<AlertTriangle
																className="h-3.5 w-3.5 text-amber-500"
																aria-label="La fecha de finalización es anterior a la de inicio"
															/>
														)}
													</span>
												</td>
												<td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
													{capacitacion.duracionHoras}
												</td>
												<td className="px-4 py-2 text-right tabular-nums font-medium text-foreground">
													{capacitacion.totalAsistentes}
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default Capacitaciones;
