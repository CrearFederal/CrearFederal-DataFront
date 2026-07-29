import * as echarts from "echarts";
import { useEffect, useRef } from "react";
import type { TestBiotipoItem, MedianaBiotipoItem } from "../types/Evaluaciones";

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
const RADAR_RADIUS_RATIO = 0.62;

export const BIOTIPO_AXES = [
	"Peso",
	"Longitud de pie",
	"Talla",
	"Longitud de mano",
	"Envergadura",
	"Talla Sentado",
];

interface RadarBiotipoChartProps {
	tests: TestBiotipoItem[];
	medianas: MedianaBiotipoItem[];
	height?: number | string;
}

function RadarBiotipoChart({ tests, medianas, height = 320 }: RadarBiotipoChartProps) {
	const chartRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!chartRef.current || (tests.length === 0 && medianas.length === 0)) return;

		const medianasByTest = new Map(medianas.map((m) => [m.testEvaluado, m.mediana]));
		const testsByName = new Map(tests.map((t) => [t.nombre, t]));

		const indicator = BIOTIPO_AXES.map((name) => ({ name, max: 10 }));
		const selectedValues = BIOTIPO_AXES.map((name) => testsByName.get(name)?.puntajePromedio ?? 0);
		const medianaValues = BIOTIPO_AXES.map((name) => medianasByTest.get(name) ?? 0);

		const richStyles: Record<string, { color: string; fontSize: number; fontWeight: number; fontFamily: string }> = {
			axisNameDefault: { color: C_AXIS, fontSize: 11, fontWeight: 600, fontFamily: "inherit" },
		};
		const tokenByName = new Map<string, string>();
		BIOTIPO_AXES.forEach((name, index) => {
			const token = `axisName${index}`;
			richStyles[token] = {
				color: AXIS_COLOR_PALETTE[index % AXIS_COLOR_PALETTE.length],
				fontSize: 11,
				fontWeight: 700,
				fontFamily: "inherit",
			};
			tokenByName.set(name, token);
		});

		const chart = echarts.init(chartRef.current, "light");

		const mainSeriesData: echarts.RadarSeriesOption["data"] = [
			{
				name: "Atleta seleccionado",
				value: selectedValues,
				symbol: "none",
				itemStyle: { color: C_BLUE_MAIN },
				lineStyle: { color: C_BLUE_MAIN, width: 2 },
				areaStyle: { color: C_BLUE_MAIN, opacity: 0.15 },
			},
			{
				name: "Mediana",
				value: medianaValues,
				symbol: "circle",
				symbolSize: 7,
				lineStyle: { color: C_GRAY_NEUTRAL, width: 2, type: "dashed" },
				itemStyle: { color: C_GRAY_NEUTRAL, borderColor: "#fff", borderWidth: 1.5, opacity: 0.65 },
				areaStyle: { color: C_GRAY_NEUTRAL, opacity: 0.05 },
			},
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
					splitNumber: 5,
					axisName: {
						color: C_AXIS,
						fontSize: 11,
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

		const drawVertexMarkers = () => {
			const radarComponent = (chart as unknown as { getModel: () => { getComponent: (type: string) => unknown } })
				.getModel()
				.getComponent("radar") as {
					coordinateSystem: { dataToPoint: (value: number, indicatorIndex: number) => [number, number] };
				};
			const elements = selectedValues.map((value, i) => {
				const [x, y] = radarComponent.coordinateSystem.dataToPoint(value, i);
				const axisName = BIOTIPO_AXES[i];
				const test = testsByName.get(axisName);
				const color = AXIS_COLOR_PALETTE[i % AXIS_COLOR_PALETTE.length];
				return {
					type: "circle" as const,
					position: [x, y] as [number, number],
					shape: { cx: 0, cy: 0, r: 5 },
					style: { fill: color, stroke: "#fff", lineWidth: 1.5 },
					z: 100,
					tooltip: test
						? {
							formatter: () =>
								`<div style="font-weight:700;color:${color};margin-bottom:4px;font-size:13px;">${axisName}</div>` +
								`<div style="font-size:12px;"><b>${test.valor} ${test.unidad_medida}</b></div>`,
						}
						: undefined,
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
	}, [tests, medianas]);

	const resolvedHeight = typeof height === "number" ? `${height}px` : height;

	if (tests.length === 0 && medianas.length === 0) {
		return (
			<div style={{ width: "100%", height: resolvedHeight }} className="flex items-center justify-center">
				<p className="text-sm text-muted-foreground">Seleccioná un deportista para ver su radar.</p>
			</div>
		);
	}

	return <div ref={chartRef} style={{ width: "100%", height: resolvedHeight }} />;
}

export default RadarBiotipoChart;
