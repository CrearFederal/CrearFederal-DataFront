import * as echarts from "echarts";
import { useEffect, useRef } from "react";
import type { PuntajeAptitud, MedianaAptitud } from "../types/Evaluaciones";

const C_BLUE_MAIN = "hsl(215, 85%, 52%)";
const C_AXIS = "hsl(215, 20%, 55%)";
const C_GRAY_NEUTRAL = "hsl(215, 15%, 60%)";

const AXIS_COLOR_PALETTE = [
	"#2563eb",
	"#16a34a",
	"#d97706",
	"#dc2626",
	"#7c3aed",
	"#0891b2",
	"#db2777",
	"#65a30d",
];

const RADAR_CENTER: [string, string] = ["50%", "45%"];
const RADAR_RADIUS_RATIO = 0.68;

const APTITUDES_POR_NIVEL: Record<string, string[]> = {
	Escolar:    ["Fuerza / Resistencia", "Fuerza Explosiva", "Velocidad"],
	Base:       ["Agilidad", "Flexibilidad", "Fuerza / Resistencia", "Fuerza Explosiva", "Resistencia", "Velocidad"],
	Intermedio: ["Agilidad", "Calidad de Movimiento", "Flexibilidad", "Fuerza / Resistencia", "Fuerza Explosiva", "Resistencia", "Velocidad"],
	Avanzado:   ["Agilidad", "Calidad de Movimiento", "Flexibilidad", "Fuerza / Resistencia", "Fuerza Explosiva", "Resistencia", "Velocidad"],
};

export const getAptitudesPorNivel = (nivel: string): string[] =>
	APTITUDES_POR_NIVEL[nivel] ?? APTITUDES_POR_NIVEL.Base;

const APTITUD_DISPLAY_MAP: Record<string, string> = {
	"Calidad del Patrones de Movimiento": "Calidad de Movimiento",
};

export const normalizeAptitudName = (nombre: string): string =>
	APTITUD_DISPLAY_MAP[nombre] ?? nombre;

interface RadarAptitudesChartProps {
	selected: PuntajeAptitud[];
	medianas: MedianaAptitud[];
	height?: number | string;
	nivel: string;
}

function RadarAptitudesChart({ selected, medianas, height = 320, nivel }: RadarAptitudesChartProps) {
	const chartRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!chartRef.current) return;
		if (selected.length === 0 && medianas.length === 0) return;

		const aptitudes = getAptitudesPorNivel(nivel);

		const medianasByName = new Map(medianas.map((item) => [normalizeAptitudName(item.aptitudEvaluada), item.mediana]));
		const selectedByName = new Map(selected.map((item) => [normalizeAptitudName(item.aptitudEvaluada), item.puntajePromedio]));
		const testsByAptitud = new Map(selected.map((item) => [normalizeAptitudName(item.aptitudEvaluada), item.Tests]));

		const indicator = aptitudes.map((name) => ({ name, max: 10 }));

		const richStyles: Record<string, { color: string; fontSize: number; fontWeight: number; fontFamily: string }> = {
			axisNameDefault: { color: C_AXIS, fontSize: 13, fontWeight: 600, fontFamily: "inherit" },
		};
		const tokenByName = new Map<string, string>();
		aptitudes.forEach((name, index) => {
			const token = `axisName${index}`;
			richStyles[token] = {
				color: AXIS_COLOR_PALETTE[index % AXIS_COLOR_PALETTE.length],
				fontSize: 14,
				fontWeight: 800,
				fontFamily: "inherit",
			};
			tokenByName.set(name, token);
		});

		const selectedValues = aptitudes.map((name) => selectedByName.get(name) ?? 0);
		const medianaValues = aptitudes.map((name) => medianasByName.get(name) ?? 0);

		const chart = echarts.init(chartRef.current, "light");

		// Main series: line + area only. ECharts applies symbol/symbolSize/itemStyle
		// uniformly to every vertex of a radar data item (there is no per-vertex styling
		// API), so per-aptitude colored dots are drawn separately below via `graphic`.
		const mainSeriesData: echarts.RadarSeriesOption["data"] = [];
		if (selected.length > 0) {
			mainSeriesData.push({
				name: "Atleta seleccionado",
				value: selectedValues,
				symbol: "none",
				itemStyle: { color: C_BLUE_MAIN },
				lineStyle: { color: C_BLUE_MAIN, width: 2 },
				areaStyle: { color: C_BLUE_MAIN, opacity: 0.15 },
			});
		}
		mainSeriesData.push({
			name: "Mediana",
			value: medianaValues,
			symbol: "circle",
			symbolSize: 7,
			lineStyle: { color: C_GRAY_NEUTRAL, width: 2, type: "dashed" },
			itemStyle: { color: C_GRAY_NEUTRAL, borderColor: "#fff", borderWidth: 1.5, opacity: 0.65 },
			areaStyle: { color: C_GRAY_NEUTRAL, opacity: 0.05 },
		});

		// Tooltip content for a vertex dot, shown via the `graphic` circle's own tooltip config below
		const buildVertexTooltip = (axisName: string, axisColor: string) => {
			const header = `<div style="font-weight:700;color:${axisColor};margin-bottom:4px;font-size:13px;">${axisName}</div>`;
			const tests = testsByAptitud.get(axisName) ?? [];
			if (tests.length === 0) return `${header}<span style="color:${C_AXIS};">Sin datos</span>`;
			const rows = tests.map((t) =>
				`<div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-top:2px;">
					<span style="color:${C_AXIS};max-width:180px;white-space:normal;">${t.nombre}</span>
					<span style="font-weight:600;white-space:nowrap;">${t.valor} ${t.unidad_medida}</span>
				</div>`
			).join("");
			return `${header}${rows}`;
		};

		chart.setOption(
			{
				backgroundColor: "transparent",
				tooltip: {
					trigger: "item",
					backgroundColor: "rgba(255, 255, 255, 0.98)",
					borderColor: "rgba(148, 163, 184, 0.35)",
					borderWidth: 1,
					textStyle: { fontSize: 12, color: "#0f172a" },
					formatter: () => "",
				},
				legend: {
					bottom: 4,
					left: "center",
					data: ["Atleta seleccionado", "Mediana"],
					itemWidth: 16,
					itemHeight: 10,
					itemGap: 20,
					textStyle: { fontSize: 12, color: C_AXIS },
				},
				radar: {
					indicator,
					center: RADAR_CENTER,
					radius: `${RADAR_RADIUS_RATIO * 100}%`,
					splitNumber: 4,
					axisName: {
						color: C_AXIS,
						fontSize: 13,
						fontFamily: "inherit",
						formatter: (name: string) => `{${tokenByName.get(name) ?? "axisNameDefault"}|${name}}`,
						rich: richStyles,
					},
					axisLine: { lineStyle: { color: "hsl(215, 20%, 85%)" } },
					axisLabel: { show: false },
					splitLine: { lineStyle: { color: "hsl(215, 20%, 88%)" } },
					splitArea: { areaStyle: { color: ["transparent", "rgba(148, 163, 184, 0.04)"] } },
				},
				series: [
					{
						type: "radar",
						data: mainSeriesData,
						animationDuration: 700,
						animationEasing: "cubicOut",
					},
				],
			},
			true
		);

		// ECharts has no per-vertex symbol styling on radar series, so the colored
		// dot per aptitude for the selected athlete is drawn as an overlay using the
		// radar's own coordinate system to place one circle per axis.
		const drawVertexMarkers = () => {
			if (selected.length === 0) {
				chart.setOption({ graphic: { elements: [] } });
				return;
			}
			const radarComponent = (chart as unknown as { getModel: () => { getComponent: (type: string) => unknown } })
				.getModel()
				.getComponent("radar") as {
					coordinateSystem: { dataToPoint: (value: number, indicatorIndex: number) => [number, number] };
				};
			const elements = selectedValues.map((value, i) => {
				const [x, y] = radarComponent.coordinateSystem.dataToPoint(value, i);
				const axisName = aptitudes[i];
				const color = AXIS_COLOR_PALETTE[i % AXIS_COLOR_PALETTE.length];
				return {
					type: "circle" as const,
					position: [x, y] as [number, number],
					shape: { cx: 0, cy: 0, r: 5 },
					style: { fill: color, stroke: "#fff", lineWidth: 1.5 },
					z: 100,
					tooltip: { formatter: () => buildVertexTooltip(axisName, color) },
				};
			});
			chart.setOption({ graphic: { elements } } as echarts.EChartsOption);
		};

		drawVertexMarkers();

		const handleResize = () => {
			chart.resize();
			drawVertexMarkers();
		};
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
			chart.dispose();
		};
	}, [selected, medianas, nivel]);

	const resolvedHeight = typeof height === "number" ? `${height}px` : height;

	if (selected.length === 0 && medianas.length === 0) {
		return (
			<div style={{ width: "100%", height: resolvedHeight }} className="flex items-center justify-center">
				<p className="text-sm text-muted-foreground">No hay datos de aptitudes para mostrar.</p>
			</div>
		);
	}

	return <div ref={chartRef} style={{ width: "100%", height: resolvedHeight }} />;
}

export default RadarAptitudesChart;
