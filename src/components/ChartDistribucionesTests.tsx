import * as echarts from "echarts";
import { useEffect, useMemo, useRef } from "react";
import type { DistribucionTest } from "../types/Evaluaciones";
import { getAptitudesPorNivel, normalizeAptitudName } from "./RadarAptitudesChart";

// Mirrors AXIS_COLOR_PALETTE in RadarAptitudesChart so each aptitude keeps the same
// color across the radar, the deltas list and these distributions.
const APTITUD_COLORS = [
	"#2563eb",
	"#16a34a",
	"#d97706",
	"#dc2626",
	"#7c3aed",
	"#0891b2",
	"#db2777",
	"#65a30d",
];

const ROW_HEIGHT = 78;
const TOP_OFFSET = 8;
const X_RANGE = 3.5; // rango del eje estandarizado (z-scores), nunca visible
const KDE_POINTS = 80;

const formatValor = (valor: number): string =>
	valor.toLocaleString("es-AR", { maximumFractionDigits: 2 });

/**
 * Densidad (KDE gaussiano) sobre los valores estandarizados del grupo.
 * Metodología: z = (valor − promedio del test) / desvío estándar del test.
 * Los z-scores no se muestran nunca; solo dan la forma de la curva.
 */
const gaussianKde = (zValues: number[]): [number, number][] => {
	const n = zValues.length;
	const bandwidth = Math.max(1.06 * Math.pow(n, -0.2), 0.25);
	const points: [number, number][] = [];

	for (let i = 0; i < KDE_POINTS; i++) {
		const x = -X_RANGE + (i * 2 * X_RANGE) / (KDE_POINTS - 1);
		let sum = 0;
		for (const z of zValues) {
			const u = (x - z) / bandwidth;
			sum += Math.exp(-0.5 * u * u);
		}
		points.push([x, sum / (n * bandwidth * Math.sqrt(2 * Math.PI))]);
	}

	return points;
};

interface RowData {
	nombreTest: string;
	aptitud: string;
	color: string;
	densidad: [number, number][];
	zDeportista: number;
	valorDeportista: number;
	unidad: string;
}

interface ChartDistribucionesTestsProps {
	distribuciones: DistribucionTest[];
	selectedDeportistaId: number | null;
	nivel: string;
}

function ChartDistribucionesTests({ distribuciones, selectedDeportistaId, nivel }: ChartDistribucionesTestsProps) {
	const chartRef = useRef<HTMLDivElement>(null);

	const rows = useMemo<RowData[]>(() => {
		if (!selectedDeportistaId) return [];

		const aptitudesNivel = getAptitudesPorNivel(nivel);

		const result: RowData[] = [];

		for (const dist of distribuciones) {
			const propio = dist.valores.find((v) => v.idDeportista === selectedDeportistaId);
			// Solo se grafican los tests que el deportista seleccionado tiene realizados
			if (!propio || dist.valores.length === 0) continue;

			const valores = dist.valores.map((v) => v.valor);
			const n = valores.length;
			const promedio = valores.reduce((s, v) => s + v, 0) / n;
			const desvio = Math.sqrt(valores.reduce((s, v) => s + (v - promedio) ** 2, 0) / n);

			const zValues = desvio > 0 ? valores.map((v) => (v - promedio) / desvio) : valores.map(() => 0);
			const zDeportista = desvio > 0 ? (propio.valor - promedio) / desvio : 0;

			const aptitud = normalizeAptitudName(dist.aptitudEvaluada);
			const aptitudIndex = aptitudesNivel.indexOf(aptitud);
			const color = aptitudIndex >= 0
				? APTITUD_COLORS[aptitudIndex % APTITUD_COLORS.length]
				: "#94a3b8";

			result.push({
				nombreTest: dist.nombreTest,
				aptitud,
				color,
				densidad: gaussianKde(zValues),
				zDeportista: Math.max(-X_RANGE, Math.min(X_RANGE, zDeportista)),
				valorDeportista: propio.valor,
				unidad: dist.unidadMedida ?? "",
			});
		}

		// Agrupadas por aptitud (en el orden del nivel) para que los colores queden juntos
		result.sort((a, b) => {
			const ia = aptitudesNivel.indexOf(a.aptitud);
			const ib = aptitudesNivel.indexOf(b.aptitud);
			if (ia !== ib) return ia - ib;
			return a.nombreTest.localeCompare(b.nombreTest, "es");
		});

		return result;
	}, [distribuciones, selectedDeportistaId, nivel]);

	const aptitudesEnUso = useMemo(() => {
		const seen = new Map<string, string>();
		for (const row of rows) {
			if (!seen.has(row.aptitud)) seen.set(row.aptitud, row.color);
		}
		return Array.from(seen.entries());
	}, [rows]);

	const chartHeight = rows.length * ROW_HEIGHT + TOP_OFFSET + 8;

	useEffect(() => {
		if (!chartRef.current || rows.length === 0) return;

		const chart = echarts.init(chartRef.current, "light");

		const grids: echarts.GridComponentOption[] = [];
		const xAxes: echarts.XAXisComponentOption[] = [];
		const yAxes: echarts.YAXisComponentOption[] = [];
		const series: echarts.LineSeriesOption[] = [];
		const titles: echarts.TitleComponentOption[] = [];

		rows.forEach((row, i) => {
			const gridTop = TOP_OFFSET + i * ROW_HEIGHT;
			const maxDensidad = Math.max(...row.densidad.map(([, d]) => d), 0.0001);

			grids.push({
				top: gridTop + 22,
				height: ROW_HEIGHT - 30,
				left: 12,
				right: 16,
			});

			titles.push({
				text: row.nombreTest,
				left: 12,
				top: gridTop,
				textStyle: { fontSize: 11, fontWeight: 600, color: "#475569" },
			});

			xAxes.push({
				gridIndex: i,
				type: "value",
				min: -X_RANGE,
				max: X_RANGE,
				// El eje estandarizado nunca muestra valores (metodología)
				axisLabel: { show: false },
				axisTick: { show: false },
				axisLine: { show: i === rows.length - 1, lineStyle: { color: "hsl(215, 20%, 85%)" } },
				splitLine: { show: false },
			});

			yAxes.push({
				gridIndex: i,
				type: "value",
				min: 0,
				max: maxDensidad * 1.15,
				axisLabel: { show: false },
				axisTick: { show: false },
				axisLine: { show: false },
				splitLine: { show: false },
			});

			series.push({
				type: "line",
				xAxisIndex: i,
				yAxisIndex: i,
				data: row.densidad,
				smooth: true,
				symbol: "none",
				lineStyle: { color: row.color, width: 1.5 },
				areaStyle: { color: row.color, opacity: 0.35 },
				silent: false,
				tooltip: {
					formatter: () =>
						`<div style="font-weight:700;color:${row.color};margin-bottom:2px;">${row.nombreTest}</div>` +
						`<div style="font-size:12px;">Distribución del grupo · <b>${row.aptitud}</b></div>`,
				},
				markLine: {
					silent: false,
					symbol: "none",
					data: [{ xAxis: row.zDeportista }],
					lineStyle: { color: "#0f172a", width: 1.5, type: "dashed" },
					label: {
						show: true,
						position: "end",
						formatter: `${formatValor(row.valorDeportista)}${row.unidad ? ` ${row.unidad}` : ""}`,
						fontSize: 10,
						fontWeight: 700,
						color: "#0f172a",
					},
					tooltip: {
						formatter: () =>
							`<div style="font-weight:700;margin-bottom:2px;">${row.nombreTest}</div>` +
							`<div style="font-size:12px;">Resultado del deportista: <b>${formatValor(row.valorDeportista)}${row.unidad ? ` ${row.unidad}` : ""}</b></div>`,
					},
				},
			});
		});

		chart.setOption({
			backgroundColor: "transparent",
			tooltip: {
				trigger: "item",
				backgroundColor: "rgba(255, 255, 255, 0.98)",
				borderColor: "rgba(148, 163, 184, 0.35)",
				borderWidth: 1,
				textStyle: { fontSize: 12, color: "#0f172a" },
			},
			title: titles,
			grid: grids,
			xAxis: xAxes,
			yAxis: yAxes,
			series,
		});

		const handleResize = () => chart.resize();
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
			chart.dispose();
		};
	}, [rows]);

	if (rows.length === 0) {
		return (
			<div className="flex h-40 items-center justify-center">
				<p className="text-sm text-muted-foreground">
					El deportista seleccionado no tiene tests registrados para graficar.
				</p>
			</div>
		);
	}

	return (
		<div>
			<div className="mb-2 flex flex-wrap items-center gap-3">
				{aptitudesEnUso.map(([aptitud, color]) => (
					<span key={aptitud} className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color, opacity: 0.75 }} />
						{aptitud}
					</span>
				))}
				<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<span className="h-[2px] w-4" style={{ backgroundImage: "repeating-linear-gradient(90deg,#0f172a 0 4px,transparent 4px 7px)" }} />
					Deportista seleccionado
				</span>
			</div>
			<div ref={chartRef} style={{ width: "100%", height: chartHeight }} />
		</div>
	);
}

export default ChartDistribucionesTests;
