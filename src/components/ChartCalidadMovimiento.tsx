import { useMemo } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CalidadMovimientoResult, FmsDeportista } from "../types/Evaluaciones";

const COLOR_GRAY = "#cbd5e1";
const COLOR_SELECTED = "#16a34a";
const FMS_TEST_TICKS = [0, 1, 2, 3];

function buildYAxis(maxValue: number): { domain: [number, number]; ticks: number[] } {
	const step = Math.ceil(maxValue / 8) || 1;
	const ceiling = step * 8;
	const ticks = Array.from({ length: 9 }, (_, i) => i * step);
	return { domain: [0, ceiling], ticks };
}

function stripFmsPrefix(nombre: string): string {
	return nombre.replace(/^FMS\s*[-–]\s*/i, "");
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: number }) {
	if (!active || !payload?.length) return null;
	return (
		<div className="rounded-lg border border-border bg-white px-3 py-2 shadow-lg text-xs">
			<p className="text-muted-foreground">
				Valor: <span className="font-semibold text-foreground">{label}</span>
			</p>
			<p className="font-bold mt-0.5 text-foreground">{payload[0].value} deportistas</p>
		</div>
	);
}

interface SingleTestChartProps {
	idTest: number;
	nombre: string;
	distribucion: { valor: number; cantidadDeportistas: number }[];
	selectedValue: number | null;
	yMax: number;
}

function SingleTestChart({ idTest: _idTest, nombre, distribucion, selectedValue, yMax }: SingleTestChartProps) {
	const chartData = useMemo(() => {
		const map = new Map(distribucion.map((d) => [d.valor, d.cantidadDeportistas]));
		return FMS_TEST_TICKS.map((v) => ({ valor: v, cantidad: map.get(v) ?? 0 }));
	}, [distribucion]);

	const total = useMemo(
		() => distribucion.reduce((sum, d) => sum + d.cantidadDeportistas, 0),
		[distribucion]
	);

	const titulo = stripFmsPrefix(nombre);

	return (
		<div className="rounded-xl border border-border bg-background p-3 flex flex-col gap-1.5">
			<div className="flex items-center gap-2 min-w-0">
				<p className="text-xs font-semibold text-foreground truncate flex-1" title={titulo}>
					{titulo}
				</p>
				<span className="text-xs font-bold shrink-0" style={{ color: COLOR_SELECTED }}>
					{total} deportistas
				</span>
			</div>
			<ResponsiveContainer width="100%" height={130}>
				<BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="22%">
					<XAxis
						dataKey="valor"
						tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
						tickLine={false}
						axisLine={false}
						ticks={FMS_TEST_TICKS}
					/>
					<YAxis
						tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
						tickLine={false}
						axisLine={false}
						allowDecimals={false}
						width={28}
						domain={buildYAxis(yMax).domain}
						ticks={buildYAxis(yMax).ticks}
					/>
					<Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
					<Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
						{chartData.map((entry) => (
							<Cell
								key={entry.valor}
								fill={entry.valor === selectedValue ? COLOR_SELECTED : COLOR_GRAY}
								fillOpacity={entry.cantidad === 0 ? 0.2 : 1}
							/>
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}

interface ResumenChartProps {
	resumen: { valor: number; cantidadDeportistas: number }[];
	selectedTotal: number | null;
	yMax: number;
}

function ResumenChart({ resumen, selectedTotal, yMax }: ResumenChartProps) {
	const maxValor = useMemo(() => Math.max(...resumen.map((d) => d.valor), 0), [resumen]);

	const chartData = useMemo(() => {
		const map = new Map(resumen.map((d) => [d.valor, d.cantidadDeportistas]));
		return Array.from({ length: maxValor + 1 }, (_, i) => ({ valor: i, cantidad: map.get(i) ?? 0 }));
	}, [resumen, maxValor]);

	const total = useMemo(
		() => resumen.reduce((sum, d) => sum + d.cantidadDeportistas, 0),
		[resumen]
	);

	return (
		<div className="rounded-xl border border-border bg-background p-3 flex flex-col gap-1.5">
			<div className="flex items-center gap-2">
				<p className="text-xs font-semibold text-foreground flex-1">Puntuación total FMS</p>
				<span className="text-xs font-bold shrink-0" style={{ color: COLOR_SELECTED }}>
					{total} deportistas
				</span>
			</div>
			<ResponsiveContainer width="100%" height={130}>
				<BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="16%">
					<XAxis
						dataKey="valor"
						tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
						tickLine={false}
						axisLine={false}
					/>
					<YAxis
						tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
						tickLine={false}
						axisLine={false}
						allowDecimals={false}
						width={28}
						domain={buildYAxis(yMax).domain}
						ticks={buildYAxis(yMax).ticks}
					/>
					<Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
					<Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
						{chartData.map((entry) => (
							<Cell
								key={entry.valor}
								fill={entry.valor === selectedTotal ? COLOR_SELECTED : COLOR_GRAY}
								fillOpacity={entry.cantidad === 0 ? 0.2 : 1}
							/>
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}

interface ChartCalidadMovimientoProps {
	calidad: CalidadMovimientoResult;
	selectedFms: FmsDeportista | null;
	nivel: string;
}

export default function ChartCalidadMovimiento({ calidad, selectedFms, nivel }: ChartCalidadMovimientoProps) {
	const { tests, resumen } = calidad;

	const fmsValueByTestId = useMemo(() => {
		const map = new Map<number, number>();
		selectedFms?.tests.forEach((t) => map.set(t.idTest, t.valor));
		return map;
	}, [selectedFms]);

	const selectedTotal = selectedFms?.total ?? null;
	const isAvanzado = nivel.toLowerCase() === "avanzado";

	const yMax = useMemo(() => {
		const allCounts = [
			...tests.flatMap((t) => t.distribucion.map((d) => d.cantidadDeportistas)),
			...resumen.map((d) => d.cantidadDeportistas),
		];
		return Math.max(...allCounts, 1);
	}, [tests, resumen]);

	if (!tests.length) return null;

	// Intermedio: 2+2; Avanzado: 3+4
	const firstRowCount = isAvanzado ? 3 : 2;
	const firstRow = tests.slice(0, firstRowCount);
	const secondRow = tests.slice(firstRowCount);

	return (
		<div className="flex flex-col gap-3">
			<div className={`grid gap-3 ${isAvanzado ? "grid-cols-3" : "grid-cols-2"}`}>
				{firstRow.map((test) => (
					<SingleTestChart
						key={test.idTest}
						idTest={test.idTest}
						nombre={test.nombre}
						distribucion={test.distribucion}
						selectedValue={fmsValueByTestId.get(test.idTest) ?? null}
						yMax={yMax}
					/>
				))}
			</div>

			{secondRow.length > 0 && (
				<div className={`grid gap-3 ${isAvanzado ? "grid-cols-4" : "grid-cols-2"}`}>
					{secondRow.map((test) => (
						<SingleTestChart
							key={test.idTest}
							idTest={test.idTest}
							nombre={test.nombre}
							distribucion={test.distribucion}
							selectedValue={fmsValueByTestId.get(test.idTest) ?? null}
							yMax={yMax}
						/>
					))}
				</div>
			)}

			{resumen.length > 0 && (
				<ResumenChart resumen={resumen} selectedTotal={selectedTotal} yMax={yMax} />
			)}
		</div>
	);
}
