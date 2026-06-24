import * as echarts from "echarts";
import { useEffect, useRef } from "react";

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

const ALL_APTITUDES = [
	"Agilidad",
	"Velocidad",
	"Resistencia",
	"Fuerza / Resistencia",
	"Fuerza Explosiva",
	"Flexibilidad",
];

interface AptitudValor {
	aptitudEvaluada: string;
	valor: number;
}

interface RadarAptitudesChartProps {
	selected: AptitudValor[];
	medianas: AptitudValor[];
	height?: number | string;
}

function RadarAptitudesChart({ selected, medianas, height = 320 }: RadarAptitudesChartProps) {
	const chartRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!chartRef.current) return;
		if (selected.length === 0 && medianas.length === 0) return;

		const medianasByName = new Map(medianas.map((item) => [item.aptitudEvaluada, item.valor]));
		const selectedByName = new Map(selected.map((item) => [item.aptitudEvaluada, item.valor]));

		const allValues = ALL_APTITUDES.flatMap((name) => [
			selectedByName.get(name) ?? 0,
			medianasByName.get(name) ?? 0,
		]);
		const globalMax = Math.max(...allValues, 1) * 1.2;
		const indicator = ALL_APTITUDES.map((name) => ({ name, max: globalMax }));

		const richStyles: Record<string, { color: string; fontSize: number; fontWeight: number; fontFamily: string }> = {
			axisNameDefault: { color: C_AXIS, fontSize: 13, fontWeight: 600, fontFamily: "inherit" },
		};
		const tokenByName = new Map<string, string>();
		ALL_APTITUDES.forEach((name, index) => {
			const token = `axisName${index}`;
			richStyles[token] = {
				color: AXIS_COLOR_PALETTE[index % AXIS_COLOR_PALETTE.length],
				fontSize: 14,
				fontWeight: 800,
				fontFamily: "inherit",
			};
			tokenByName.set(name, token);
		});

		const selectedValues = ALL_APTITUDES.map((name) => selectedByName.get(name) ?? 0);
		const medianaValues = ALL_APTITUDES.map((name) => medianasByName.get(name) ?? 0);

		const buildHoverHotspots = (values: number[], seriesName: string) =>
			values.map((value, index) => ({
				name: seriesName,
				value: values.map((_, i) => (i === index ? value : null)) as number[],
				vertexIndex: index,
				symbol: "none",
				lineStyle: { opacity: 0 },
				areaStyle: { opacity: 0 },
			})) as unknown as NonNullable<echarts.RadarSeriesOption["data"]>;

		const chart = echarts.init(chartRef.current, "light");

		const vertexColors = ALL_APTITUDES.map((_, i) => AXIS_COLOR_PALETTE[i % AXIS_COLOR_PALETTE.length]);

		const buildVertexDotSeries = (values: number[], size: number, opacity: number): echarts.RadarSeriesOption[] =>
			values.map((_, i) => ({
				type: "radar" as const,
				silent: true,
				data: [{
					value: values.map((v, j) => j === i ? v : null) as (number | null)[],
					symbolSize: size,
					symbol: "circle",
					lineStyle: { opacity: 0 },
					areaStyle: { opacity: 0 },
					itemStyle: {
						color: vertexColors[i],
						borderColor: "#fff",
						borderWidth: 1.5,
						opacity,
					},
				}],
			}));

		const series: echarts.RadarSeriesOption["data"] = [];
		if (selected.length > 0) {
			series.push({
				name: "Atleta seleccionado",
				value: selectedValues,
				symbolSize: 0,
				lineStyle: { color: C_BLUE_MAIN, width: 2 },
				itemStyle: { color: C_BLUE_MAIN },
				areaStyle: { color: C_BLUE_MAIN, opacity: 0.15 },
			});
			series.push(...buildHoverHotspots(selectedValues, "Atleta seleccionado"));
		}
		series.push({
			name: "Mediana",
			value: medianaValues,
			symbolSize: 0,
			lineStyle: { color: C_GRAY_NEUTRAL, width: 2, type: "dashed" },
			itemStyle: { color: C_GRAY_NEUTRAL },
			areaStyle: { color: C_GRAY_NEUTRAL, opacity: 0.05 },
		});
		series.push(...buildHoverHotspots(medianaValues, "Mediana"));

		const dotSeries = [
			...(selected.length > 0 ? buildVertexDotSeries(selectedValues, 10, 1) : []),
			...buildVertexDotSeries(medianaValues, 7, 0.65),
		];

		chart.setOption(
			{
				backgroundColor: "transparent",
				tooltip: {
					trigger: "item",
					backgroundColor: "rgba(255, 255, 255, 0.98)",
					borderColor: "rgba(148, 163, 184, 0.35)",
					borderWidth: 1,
					textStyle: { fontSize: 12, color: "#0f172a" },
					formatter: (params: unknown) => {
						const { value, seriesName, name, data } = params as {
							value: number[];
							seriesName?: string;
							name?: string;
							data?: { vertexIndex?: number };
						};
						const label = name ?? seriesName ?? "";
						const vertexIndex = data?.vertexIndex;

						if (vertexIndex !== undefined) {
							const axisColor = AXIS_COLOR_PALETTE[vertexIndex % AXIS_COLOR_PALETTE.length];
							const axisName = indicator[vertexIndex]?.name ?? "";
							return `<div style="font-weight:600;margin-bottom:2px;">${label}</div><div style="color:${C_AXIS};margin-bottom:2px;">${axisName}</div><span style="color:${axisColor};font-weight:700;font-size:13px;">${Number(value[vertexIndex]).toFixed(1)}</span>`;
						}

						const rows = value
							.map((entryValue, index) => {
								const axisColor = AXIS_COLOR_PALETTE[index % AXIS_COLOR_PALETTE.length];
								return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;"><span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${axisColor};margin-right:6px;"></span>${indicator[index]?.name ?? ""}</span><span style="font-weight:600;">${Number(entryValue).toFixed(1)}</span></div>`;
							})
							.join("");
						return `<div style="font-weight:600;margin-bottom:4px;">${label}</div>${rows}`;
					},
				},
				legend: {
					bottom: 4,
					left: "center",
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
					axisLabel: {
						show: true,
						color: C_AXIS,
						fontSize: 11,
						fontFamily: "inherit",
						backgroundColor: "rgba(255, 255, 255, 0.82)",
						padding: [1, 3],
						formatter: (value: number | string) => Number(value).toFixed(1),
					},
					splitLine: { lineStyle: { color: "hsl(215, 20%, 88%)" } },
					splitArea: { areaStyle: { color: ["transparent", "rgba(148, 163, 184, 0.04)"] } },
				},
				series: [
					{
						type: "radar",
						data: series,
						animationDuration: 700,
						animationEasing: "cubicOut",
					},
					...dotSeries,
				],
			},
			true
		);

		const handleResize = () => {
			chart.resize();
		};
		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
			chart.dispose();
		};
	}, [selected, medianas]);

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
