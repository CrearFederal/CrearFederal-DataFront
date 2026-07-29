import { useMemo } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CalidadMovimientoTest } from "../types/Evaluaciones";

const COLOR_BASE = "#f43f5e";
const COLOR_PEAK = "#9f1239";

const FMS_RANGE = Array.from({ length: 13 }, (_, i) => i);

function stripFmsPrefix(nombre: string): string {
	return nombre.replace(/^FMS\s*[-–]\s*/i, "");
}

function CustomTooltip({ active, payload, label }: any) {
	if (!active || !payload?.length) return null;
	return (
		<div className="rounded-lg border border-border bg-white px-3 py-2 shadow-lg text-xs">
			<p className="text-muted-foreground">Puntaje: <span className="font-semibold text-foreground">{label}</span></p>
			<p style={{ color: COLOR_PEAK }} className="font-bold mt-0.5">
				{payload[0].value} deportistas
			</p>
		</div>
	);
}

interface SingleTestChartProps {
	test: CalidadMovimientoTest;
}

function SingleTestChart({ test }: SingleTestChartProps) {
	const chartData = useMemo(() => {
		const map = new Map(test.distribucion.map((d) => [d.valor, d.cantidadDeportistas]));
		return FMS_RANGE.map((v) => ({ valor: v, cantidad: map.get(v) ?? 0 }));
	}, [test.distribucion]);

	const maxCantidad = useMemo(
		() => Math.max(...chartData.map((d) => d.cantidad), 1),
		[chartData]
	);

	const titulo = stripFmsPrefix(test.nombre);

	return (
		<div className="rounded-xl border border-border bg-background p-3 flex flex-col gap-2">
			<p className="text-xs font-semibold text-foreground truncate" title={titulo}>
				{titulo}
			</p>
			<ResponsiveContainer width="100%" height={150}>
				<BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="20%">
					<XAxis
						dataKey="valor"
						tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
						tickLine={false}
						axisLine={false}
						domain={[0, 12]}
						ticks={FMS_RANGE}
					/>
					<YAxis
						tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
						tickLine={false}
						axisLine={false}
						allowDecimals={false}
						width={28}
					/>
					<Tooltip content={<CustomTooltip />} cursor={{ fill: `${COLOR_BASE}18` }} />
					<Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
						{chartData.map((entry) => (
							<Cell
								key={entry.valor}
								fill={entry.cantidad === maxCantidad && entry.cantidad > 0 ? COLOR_PEAK : COLOR_BASE}
								fillOpacity={entry.cantidad === 0 ? 0.12 : entry.cantidad === maxCantidad ? 1 : 0.55}
							/>
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}

interface ChartCalidadMovimientoProps {
	tests: CalidadMovimientoTest[];
}

export default function ChartCalidadMovimiento({ tests }: ChartCalidadMovimientoProps) {
	if (!tests.length) return null;

	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
			{tests.map((test) => (
				<SingleTestChart key={test.idTest} test={test} />
			))}
		</div>
	);
}
