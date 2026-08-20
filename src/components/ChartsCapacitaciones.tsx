import type { ReactNode } from "react";
import { useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ComposedChart,
	Legend,
	Line,
	Pie,
	PieChart,
	PolarAngleAxis,
	RadialBar,
	RadialBarChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { ChartColumnBig } from "lucide-react";
import type { CapacitacionesPorMesItem, ConteoItem } from "../types/Capacitaciones";

const nf = new Intl.NumberFormat("es-AR");

/** Paleta de la sección, en el orden en que se asigna a las categorías. */
const PALETA_CAPACITACIONES = [
	"#6366f1",
	"#22d3ee",
	"#f59e0b",
	"#ec4899",
	"#10b981",
	"#8b5cf6",
	"#f97316",
];

export function ChartShell({
	title,
	subtitle,
	icon,
	headerRight,
	children,
	className = "",
}: {
	title: string;
	subtitle?: string;
	icon?: ReactNode;
	headerRight?: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={`relative rounded-xl border border-border bg-card p-4 shadow-sm ${className}`}>
			<div className="mb-3 flex items-start justify-between gap-3">
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<span className="text-primary">{icon ?? <ChartColumnBig className="h-4 w-4" />}</span>
						<h3 className="text-sm font-semibold text-foreground">{title}</h3>
					</div>
					{subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
				</div>
				{headerRight}
			</div>
			{children}
		</div>
	);
}

function EmptyState({ height, mensaje }: { height: number; mensaje: string }) {
	return (
		<div
			className="flex w-full items-center justify-center rounded-xl border border-dashed border-border bg-background/50 px-4 text-center"
			style={{ height }}
		>
			<p className="text-sm text-muted-foreground">{mensaje}</p>
		</div>
	);
}

function TooltipCard({ titulo, filas }: { titulo: string; filas: { label: string; valor: string; color?: string }[] }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 6, scale: 0.96 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{ duration: 0.2 }}
			className="rounded-xl border border-border bg-white px-3.5 py-2.5 shadow-2xl"
		>
			<div className="text-xs font-bold uppercase tracking-wider text-primary">{titulo}</div>
			<div className="mt-1.5 space-y-1">
				{filas.map((fila) => (
					<div key={fila.label} className="flex items-center gap-2 text-sm text-foreground">
						{fila.color && (
							<span className="h-2.5 w-2.5 rounded-sm" style={{ background: fila.color }} />
						)}
						<span className="text-muted-foreground">{fila.label}</span>
						<span className="ml-auto font-semibold tabular-nums">{fila.valor}</span>
					</div>
				))}
			</div>
		</motion.div>
	);
}

// ------------------------------------------------------------- evolución mensual

export function CapacitacionesMensualChart({
	data,
	height = 300,
	className = "",
	title = "Evolución mensual",
	subtitle = "Capacitaciones dictadas y asistencias registradas por mes",
}: {
	data: CapacitacionesPorMesItem[];
	height?: number;
	className?: string;
	title?: string;
	subtitle?: string;
}) {
	const leyenda = (
		<div className="flex items-center gap-3 pt-0.5 text-[10px] text-muted-foreground">
			<span className="flex items-center gap-1.5">
				<span className="h-2.5 w-2.5 rounded-sm" style={{ background: PALETA_CAPACITACIONES[0] }} />
				Capacitaciones
			</span>
			<span className="flex items-center gap-1.5">
				<span className="h-2.5 w-2.5 rounded-sm" style={{ background: PALETA_CAPACITACIONES[2] }} />
				Asistencias
			</span>
		</div>
	);

	return (
		<ChartShell title={title} subtitle={subtitle} headerRight={leyenda} className={className}>
			{data.length === 0 ? (
				<EmptyState height={height} mensaje="No hay capacitaciones en el período seleccionado." />
			) : (
				<ResponsiveContainer width="100%" height={height} debounce={50}>
					<ComposedChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 4 }}>
						<defs>
							<linearGradient id="capMesFill" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor={PALETA_CAPACITACIONES[0]} stopOpacity={0.95} />
								<stop offset="100%" stopColor={PALETA_CAPACITACIONES[0]} stopOpacity={0.45} />
							</linearGradient>
						</defs>
						<CartesianGrid stroke="currentColor" strokeOpacity={0.06} strokeDasharray="3 6" vertical={false} />
						<XAxis
							dataKey="etiqueta"
							tick={{ fill: "currentColor", fontSize: 11 }}
							tickFormatter={(valor: string) => String(valor).slice(0, 3).toUpperCase()}
							axisLine={false}
							tickLine={false}
							dy={6}
						/>
						<YAxis
							yAxisId="left"
							tick={{ fill: "currentColor", fillOpacity: 0.45, fontSize: 11 }}
							axisLine={false}
							tickLine={false}
							width={34}
							allowDecimals={false}
						/>
						<YAxis
							yAxisId="right"
							orientation="right"
							tick={{ fill: "currentColor", fillOpacity: 0.45, fontSize: 11 }}
							axisLine={false}
							tickLine={false}
							width={38}
							allowDecimals={false}
						/>
						<Tooltip
							cursor={{ fill: "currentColor", fillOpacity: 0.04 }}
							content={({ active, payload }) => {
								if (!active || !payload?.length) return null;
								const punto = payload[0].payload as CapacitacionesPorMesItem;
								return (
									<TooltipCard
										titulo={punto.etiqueta}
										filas={[
											{
												label: "Capacitaciones",
												valor: nf.format(punto.capacitaciones),
												color: PALETA_CAPACITACIONES[0],
											},
											{
												label: "Asistencias",
												valor: nf.format(punto.asistencias),
												color: PALETA_CAPACITACIONES[2],
											},
										]}
									/>
								);
							}}
						/>
						<Bar
							yAxisId="left"
							dataKey="capacitaciones"
							fill="url(#capMesFill)"
							radius={[6, 6, 0, 0]}
							maxBarSize={34}
							animationDuration={900}
						/>
						<Line
							yAxisId="right"
							type="monotone"
							dataKey="asistencias"
							stroke={PALETA_CAPACITACIONES[2]}
							strokeWidth={2.5}
							dot={{ r: 3, fill: PALETA_CAPACITACIONES[2], strokeWidth: 0 }}
							activeDot={{ r: 5 }}
							animationDuration={1200}
						/>
					</ComposedChart>
				</ResponsiveContainer>
			)}
		</ChartShell>
	);
}

// ------------------------------------------------------------- ranking horizontal

/** Barras horizontales para cualquier distribución de conteos. */
export function ConteoBarChart({
	data,
	height = 260,
	title,
	subtitle,
	icon,
	unidad = "registros",
	color = PALETA_CAPACITACIONES[0],
	className = "",
	maxItems = 8,
	anchoEtiqueta = 170,
}: {
	data: ConteoItem[];
	height?: number;
	title: string;
	subtitle?: string;
	icon?: ReactNode;
	unidad?: string;
	color?: string;
	className?: string;
	maxItems?: number;
	anchoEtiqueta?: number;
}) {
	const chartData = useMemo(() => data.slice(0, maxItems), [data, maxItems]);
	const total = useMemo(() => data.reduce((suma, item) => suma + item.cantidad, 0), [data]);

	return (
		<ChartShell title={title} subtitle={subtitle} icon={icon} className={className}>
			{chartData.length === 0 ? (
				<EmptyState height={height} mensaje="Sin datos para mostrar." />
			) : (
				<ResponsiveContainer width="100%" height={height} debounce={50}>
					<BarChart
						data={chartData}
						layout="vertical"
						margin={{ top: 4, right: 28, left: 0, bottom: 4 }}
					>
						<CartesianGrid stroke="currentColor" strokeOpacity={0.06} strokeDasharray="3 6" horizontal={false} />
						<XAxis type="number" hide allowDecimals={false} />
						<YAxis
							type="category"
							dataKey="nombre"
							tick={{ fill: "currentColor", fontSize: 11 }}
							axisLine={false}
							tickLine={false}
							width={anchoEtiqueta}
							tickFormatter={(valor: string) =>
								valor.length > 30 ? `${valor.slice(0, 29)}…` : valor
							}
						/>
						<Tooltip
							cursor={{ fill: "currentColor", fillOpacity: 0.04 }}
							content={({ active, payload }) => {
								if (!active || !payload?.length) return null;
								const punto = payload[0].payload as ConteoItem;
								const porcentaje = total ? (punto.cantidad / total) * 100 : 0;
								return (
									<TooltipCard
										titulo={punto.nombre}
										filas={[
											{ label: unidad, valor: nf.format(punto.cantidad), color },
											{ label: "del total", valor: `${porcentaje.toFixed(1)}%` },
										]}
									/>
								);
							}}
						/>
						<Bar dataKey="cantidad" radius={[0, 6, 6, 0]} maxBarSize={26} animationDuration={900}>
							{chartData.map((item, index) => (
								<Cell
									key={item.nombre}
									fill={color}
									fillOpacity={1 - index * (0.5 / Math.max(chartData.length, 1))}
								/>
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			)}
		</ChartShell>
	);
}

// ------------------------------------------------------------- arcos radiales

/**
 * Arcos concéntricos proporcionales al total, con la lista al costado.
 * Para distribuciones de pocas categorías con nombres largos.
 */
export function ConteoRadialChart({
	data,
	title,
	subtitle,
	icon,
	unidad = "registros",
	className = "",
	size = 190,
}: {
	data: ConteoItem[];
	title: string;
	subtitle?: string;
	icon?: ReactNode;
	unidad?: string;
	className?: string;
	size?: number;
}) {
	const total = useMemo(() => data.reduce((suma, item) => suma + item.cantidad, 0), [data]);
	const chartData = useMemo(
		() =>
			data.map((item, index) => ({
				...item,
				fill: PALETA_CAPACITACIONES[index % PALETA_CAPACITACIONES.length],
			})),
		[data]
	);

	const encabezado = total > 0 && (
		<span className="shrink-0 pt-0.5 text-xs text-muted-foreground">
			{nf.format(total)} {unidad}
		</span>
	);

	return (
		<ChartShell title={title} subtitle={subtitle} icon={icon} headerRight={encabezado} className={className}>
			{total === 0 ? (
				<EmptyState height={size} mensaje="Sin datos para mostrar." />
			) : (
				<div className="flex flex-wrap items-center gap-4">
					<div className="relative shrink-0" style={{ width: size, height: size }}>
						<ResponsiveContainer width="100%" height="100%" debounce={50}>
							<RadialBarChart
								data={chartData}
								innerRadius="38%"
								outerRadius="100%"
								startAngle={90}
								endAngle={-270}
								barSize={13}
							>
								<PolarAngleAxis type="number" domain={[0, total]} angleAxisId={0} tick={false} />
								<RadialBar
									dataKey="cantidad"
									background={{ fill: "currentColor", fillOpacity: 0.07 }}
									cornerRadius={7}
									animationDuration={1000}
								/>
								<Tooltip
									cursor={false}
									content={({ active, payload }) => {
										if (!active || !payload?.length) return null;
										const punto = payload[0].payload as ConteoItem & { fill: string };
										const porcentaje = total ? (punto.cantidad / total) * 100 : 0;
										return (
											<TooltipCard
												titulo={punto.nombre}
												filas={[
													{ label: unidad, valor: nf.format(punto.cantidad), color: punto.fill },
													{ label: "del total", valor: `${porcentaje.toFixed(1)}%` },
												]}
											/>
										);
									}}
								/>
							</RadialBarChart>
						</ResponsiveContainer>
						<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
							<span className="font-mono text-xl font-bold leading-none text-foreground tabular-nums">
								{nf.format(total)}
							</span>
							<span className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
								total
							</span>
						</div>
					</div>

					<div className="min-w-[180px] flex-1 space-y-2.5">
						{chartData.map((item) => (
							<div key={item.nombre} className="flex items-start gap-2">
								<span
									className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm"
									style={{ background: item.fill }}
								/>
								<div className="min-w-0 flex-1">
									<p className="text-xs leading-snug text-foreground">{item.nombre}</p>
									<p className="text-xs text-muted-foreground tabular-nums">
										{nf.format(item.cantidad)} {unidad} ·{" "}
										{((item.cantidad / total) * 100).toFixed(0)}%
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</ChartShell>
	);
}

// ------------------------------------------------------------- barra apilada

/**
 * Barra 100% apilada con el desglose debajo. Para distribuciones de pocas
 * categorías, donde una torta desperdicia el ancho de la tarjeta.
 */
export function ConteoStackedBar({
	data,
	title,
	subtitle,
	icon,
	unidad = "registros",
	className = "",
}: {
	data: ConteoItem[];
	title: string;
	subtitle?: string;
	icon?: ReactNode;
	unidad?: string;
	className?: string;
}) {
	const total = useMemo(() => data.reduce((suma, item) => suma + item.cantidad, 0), [data]);

	const encabezado = total > 0 && (
		<span className="shrink-0 pt-0.5 text-xs text-muted-foreground">
			{nf.format(total)} {unidad}
		</span>
	);

	return (
		<ChartShell title={title} subtitle={subtitle} icon={icon} headerRight={encabezado} className={className}>
			{total === 0 ? (
				<EmptyState height={120} mensaje="Sin datos para mostrar." />
			) : (
				<>
					<div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
						{data.map((item, index) => (
							<motion.div
								key={item.nombre}
								initial={{ width: 0 }}
								animate={{ width: `${(item.cantidad / total) * 100}%` }}
								transition={{ duration: 0.7, ease: "easeOut", delay: index * 0.08 }}
								className="h-full"
								style={{ background: PALETA_CAPACITACIONES[index % PALETA_CAPACITACIONES.length] }}
								title={`${item.nombre}: ${nf.format(item.cantidad)} (${((item.cantidad / total) * 100).toFixed(1)}%)`}
							/>
						))}
					</div>

					<div className="mt-4 flex flex-wrap gap-3">
						{data.map((item, index) => (
							<div
								key={item.nombre}
								className="min-w-[110px] flex-1 rounded-lg border border-border bg-background/50 px-3 py-2"
							>
								<div className="flex items-center gap-1.5">
									<span
										className="h-2.5 w-2.5 shrink-0 rounded-sm"
										style={{ background: PALETA_CAPACITACIONES[index % PALETA_CAPACITACIONES.length] }}
									/>
									<span className="truncate text-xs text-muted-foreground" title={item.nombre}>
										{item.nombre}
									</span>
								</div>
								<div className="mt-1 flex items-baseline gap-1.5">
									<span className="font-mono text-lg font-bold leading-none text-foreground tabular-nums">
										{((item.cantidad / total) * 100).toFixed(0)}%
									</span>
									<span className="text-xs text-muted-foreground tabular-nums">
										{nf.format(item.cantidad)}
									</span>
								</div>
							</div>
						))}
					</div>
				</>
			)}
		</ChartShell>
	);
}

// ------------------------------------------------------------- donut

export function ConteoDonutChart({
	data,
	height = 260,
	title,
	subtitle,
	icon,
	unidad = "registros",
	className = "",
}: {
	data: ConteoItem[];
	height?: number;
	title: string;
	subtitle?: string;
	icon?: ReactNode;
	unidad?: string;
	className?: string;
}) {
	const total = useMemo(() => data.reduce((suma, item) => suma + item.cantidad, 0), [data]);

	return (
		<ChartShell title={title} subtitle={subtitle} icon={icon} className={className}>
			{total === 0 ? (
				<EmptyState height={height} mensaje="Sin datos para mostrar." />
			) : (
				<ResponsiveContainer width="100%" height={height} debounce={50}>
					<PieChart>
						<Pie
							data={data}
							dataKey="cantidad"
							nameKey="nombre"
							innerRadius="52%"
							outerRadius="78%"
							paddingAngle={2}
							stroke="none"
							animationDuration={900}
						>
							{data.map((item, index) => (
								<Cell
									key={item.nombre}
									fill={PALETA_CAPACITACIONES[index % PALETA_CAPACITACIONES.length]}
								/>
							))}
						</Pie>
						<Tooltip
							content={({ active, payload }) => {
								if (!active || !payload?.length) return null;
								const punto = payload[0].payload as ConteoItem;
								const porcentaje = total ? (punto.cantidad / total) * 100 : 0;
								const index = data.findIndex((item) => item.nombre === punto.nombre);
								return (
									<TooltipCard
										titulo={punto.nombre}
										filas={[
											{
												label: unidad,
												valor: nf.format(punto.cantidad),
												color: PALETA_CAPACITACIONES[index % PALETA_CAPACITACIONES.length],
											},
											{ label: "del total", valor: `${porcentaje.toFixed(1)}%` },
										]}
									/>
								);
							}}
						/>
						<Legend
							verticalAlign="bottom"
							iconType="circle"
							iconSize={8}
							formatter={(valor: string) => (
								<span className="text-xs text-muted-foreground">{valor}</span>
							)}
						/>
					</PieChart>
				</ResponsiveContainer>
			)}
		</ChartShell>
	);
}
