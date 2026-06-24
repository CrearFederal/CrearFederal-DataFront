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

		const indicatorSource = selected.length > 0 ? selected : medianas;
		const medianasByName = new Map(medianas.map((item) => [item.aptitudEvaluada, item.valor]));
		const selectedByName = new Map(selected.map((item) => [item.aptitudEvaluada, item.valor]));

		const allValues = indicatorSource.flatMap((item) => [
			selectedByName.get(item.aptitudEvaluada) ?? 0,
			medianasByName.get(item.aptitudEvaluada) ?? 0,
		]);
		const globalMax = Math.max(...allValues, 1) * 1.2;
		const indicator = indicatorSource.map((item) => ({ name: item.aptitudEvaluada, max: globalMax }));

		const richStyles: Record<string, { color: string; fontSize: number; fontWeight: number; fontFamily: string }> = {
			axisNameDefault: { color: C_AXIS, fontSize: 13, fontWeight: 600, fontFamily: "inherit" },
		};
		const tokenByName = new Map<string, string>();
		indicatorSource.forEach((item, index) => {
			const token = `axisName${index}`;
			richStyles[token] = {
				color: AXIS_COLOR_PALETTE[index % AXIS_COLOR_PALETTE.length],
				fontSize: 13,
				fontWeight: 600,
				fontFamily: "inherit",
			};
			tokenByName.set(item.aptitudEvaluada, token);
		});

		const selectedValues = indicatorSource.map((item) => selectedByName.get(item.aptitudEvaluada) ?? 0);
		const medianaValues = indicatorSource.map((item) => medianasByName.get(item.aptitudEvaluada) ?? 0);

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
						const label = seriesName ?? name ?? "";
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
				],
			},
			true
		);

		const drawVertexDots = () => {
			if (!chartRef.current) return;
			const width = chartRef.current.clientWidth;
			const containerHeight = chartRef.current.clientHeight;
			const outerRadius = (Math.min(width, containerHeight) / 2) * RADAR_RADIUS_RATIO;
			const centerX = width * 0.5;
			const centerY = containerHeight * 0.45;
			const axisCount = indicator.length;

			const dotFor = (values: number[], index: number, symbolRadius: number, opacity: number) => {
				const angle = -Math.PI / 2 + index * ((2 * Math.PI) / axisCount);
				const pointRadius = outerRadius * (values[index] / globalMax);
				return {
					type: "circle" as const,
					silent: true,
					shape: {
						cx: centerX + pointRadius * Math.cos(angle),
						cy: centerY + pointRadius * Math.sin(angle),
						r: symbolRadius,
					},
					style: {
						fill: AXIS_COLOR_PALETTE[index % AXIS_COLOR_PALETTE.length],
						opacity,
						stroke: "#fff",
						lineWidth: 1.5,
					},
					z: 10,
				};
			};

			const buildDots = (values: number[], symbolRadius: number, opacity: number) =>
				values.map((_, index) => dotFor(values, index, symbolRadius, opacity));

			const elements = [
				...(selected.length > 0 ? buildDots(selectedValues, 5, 1) : []),
				...buildDots(medianaValues, 3.5, 0.65),
			];

			chart.setOption({ graphic: elements });
		};
		drawVertexDots();

		const handleResize = () => {
			chart.resize();
			drawVertexDots();
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
