import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";
import * as echarts from 'echarts';
import 'echarts-gl';
import { useEffect, useRef } from 'react';

// ---------------- DESIGN TOKENS ----------------

const C_BLUE_MAIN = "hsl(215, 85%, 52%)";
const C_BLUE_LIGHT = "hsl(218, 80%, 68%)";
const C_FEMALE = "hsl(330, 65%, 58%)";
const C_MALE = "hsl(215, 85%, 52%)";
const C_AXIS = "hsl(215, 20%, 55%)";


// shared axis/text styles
const axisStyle = {
  tickLabelStyle: { fontSize: 10, fill: C_AXIS, fontFamily: "inherit" },
  labelStyle: { fontSize: 10, fill: C_AXIS, fontFamily: "inherit" },
};

// ---------------- SHARED ----------------

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

function ChartCard({ title, subtitle, children, className = "" }: ChartCardProps) {
  return (
    <div className={`rounded-xl border border-border bg-card p-4 flex flex-col ${className}`}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ---------------- ATHLETES PER SPORT — 3D vertical bar ----------------

interface AthletesPerSportChartProps {
  data: { sport: string; male: number; female: number }[];
}

export function AthletesPerSportChart({ data }: AthletesPerSportChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    // Limitamos a los deportes con mayor volumen para que el 3D sea legible.
    const topSports = [...data]
      .sort((a, b) => (b.male + b.female) - (a.male + a.female))
      .slice(0, 5);

    const chart = echarts.init(chartRef.current, "light");

    const sports = topSports.map((d) => d.sport);
    const genders = ["Masculino", "Femenino"];

    // [x=deporte, y=genero, z=cantidad]
    const bar3dData: [number, number, number][] = [];
    topSports.forEach((item, sportIndex) => {
      bar3dData.push([sportIndex, 0, item.male]);
      bar3dData.push([sportIndex, 1, item.female]);
    });

    const option = {
      backgroundColor: "transparent",
      tooltip: {
        confine: true,
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        borderColor: "rgba(148, 163, 184, 0.35)",
        borderWidth: 1,
        textStyle: { fontSize: 12, color: "#0f172a" },
        formatter: (params: any) => {
          if (params.componentSubType === "bar3D") {
            const sportIdx = params.value[0];
            const genderIdx = params.value[1];
            const count = params.value[2];
            const sport = sports[sportIdx] || "Deporte";
            const valueColor = genderIdx === 0 ? C_MALE : C_FEMALE;
            return `<span style="color:${valueColor};font-weight:700;">${sport}</span><br/><span style="color:#0f172a;font-weight:400;">Deportistas: </span><span style="color:${valueColor};font-weight:700;">${count.toLocaleString('es-AR')}</span>`;
          }
          return "";
        },
      },
      grid3D: {
        top: "-10%",
        bottom: "14%",
        left: "5%",
        right: "5%",
        boxWidth: 200,
        boxDepth: 90,
        boxHeight: 98,
        axisLine: {
          lineStyle: { color: "rgba(100, 116, 139, 0.45)" },
        },
        axisPointer: { show: false },
        splitLine: {
          lineStyle: { color: "rgba(100, 116, 139, 0.18)" },
        },
        viewControl: {
          autoRotate: true,
          autoRotateSpeed: 8,
          autoRotateAfterStill: 0,
          projection: "perspective",
          alpha: 18,
          beta: 26,
          distance: 275,
          panSensitivity: 0,
          zoomSensitivity: 0,
          rotateSensitivity: 0,
        },
        light: {
          main: {
            intensity: 1.1,
            shadow: false,
          },
          ambient: {
            intensity: 0.4,
          },
        },
      },
      xAxis3D: {
        type: "category",
        name: "",
        data: sports,
        axisLabel: {
          interval: 0,
          fontSize: 11,
          color: C_AXIS,
          rotate: 25,
          margin: 16,
        },
      },
      yAxis3D: {
        type: "category",
        name: "",
        data: genders,
        axisLabel: { color: C_AXIS, fontSize: 11, margin: 10 },
      },
      zAxis3D: {
        type: "value",
        name: "",
        axisLabel: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        minInterval: 1,
      },
      series: [
        {
          type: "bar3D",
          data: bar3dData,
          shading: "color",
          barSize: 18,
          bevelSize: 0.25,
          minHeight: 2,
          label: {
            show: true,
            distance: 2,
            formatter: (params: { value: [number, number, number] }) => {
              const genderIdx = params.value[1];
              const count = params.value[2].toLocaleString("es-AR");
              const styleKey = genderIdx === 0 ? "maleTag" : "femaleTag";
              return `{${styleKey}|${count}}`;
            },
            rich: {
              maleTag: {
                color: "#eff6ff",
                backgroundColor: "rgba(37, 99, 235, 0.82)",
                borderColor: "rgba(147, 197, 253, 0.5)",
                borderWidth: 1,
                borderRadius: 8,
                padding: [3, 6],
                fontSize: 10,
                fontWeight: 600,
                textBorderColor: "rgba(15, 23, 42, 0.25)",
                textBorderWidth: 1,
              },
              femaleTag: {
                color: "#fff1f2",
                backgroundColor: "rgba(219, 39, 119, 0.82)",
                borderColor: "rgba(251, 182, 206, 0.55)",
                borderWidth: 1,
                borderRadius: 8,
                padding: [3, 6],
                fontSize: 10,
                fontWeight: 600,
                textBorderColor: "rgba(15, 23, 42, 0.25)",
                textBorderWidth: 1,
              },
            },
          },
          itemStyle: {
            color: (params: { value: [number, number, number] }) =>
              params.value[1] === 0 ? C_MALE : C_FEMALE,
            opacity: 0.95,
            borderWidth: 0.6,
            borderColor: "rgba(15, 23, 42, 0.45)",
          },
          emphasis: {
            label: {
              show: false,
            },
            itemStyle: {
              opacity: 1,
            },
          },
        },
      ],
    };

    chart.setOption(option, true);

    // Permitimos hover (mousemove) pero bloqueamos interacciones que pausan la auto-rotacion.
    const blockChartInteraction = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const chartDom = chartRef.current;
    chartDom.addEventListener("mousedown", blockChartInteraction, true);
    chartDom.addEventListener("mouseup", blockChartInteraction, true);
    chartDom.addEventListener("click", blockChartInteraction, true);
    chartDom.addEventListener("dblclick", blockChartInteraction, true);
    chartDom.addEventListener("contextmenu", blockChartInteraction, true);
    chartDom.addEventListener("wheel", blockChartInteraction, true);
    chartDom.addEventListener("touchstart", blockChartInteraction, true);
    chartDom.addEventListener("touchmove", blockChartInteraction, true);

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      chartDom.removeEventListener("mousedown", blockChartInteraction, true);
      chartDom.removeEventListener("mouseup", blockChartInteraction, true);
      chartDom.removeEventListener("click", blockChartInteraction, true);
      chartDom.removeEventListener("dblclick", blockChartInteraction, true);
      chartDom.removeEventListener("contextmenu", blockChartInteraction, true);
      chartDom.removeEventListener("wheel", blockChartInteraction, true);
      chartDom.removeEventListener("touchstart", blockChartInteraction, true);
      chartDom.removeEventListener("touchmove", blockChartInteraction, true);
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [data]);

  return (
    <ChartCard
      title="Top 5 Deportes"
      subtitle="Eje X: Deportes · Eje Y: Género · Eje Z: Cantidad de deportistas"
    >
      <div
        ref={chartRef}
        style={{
          width: "100%",
          height: "480px",
          position: "relative",
        }}
      />
    </ChartCard>
  );
}

// ---------------- GENDER DISTRIBUTION — donut ----------------

interface GenderDistributionChartProps {
  data: {
    male: number;
    female: number;
    malePercent: number;
    femalePercent: number;
  };
}

export function GenderDistributionChart({ data }: GenderDistributionChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current, "light");

    const option = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        borderColor: "rgba(148, 163, 184, 0.35)",
        borderWidth: 1,
        textStyle: { fontSize: 12, color: "#0f172a" },
        formatter: (params: any) => {
          const color = params.data.itemStyle.color;
          return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:6px;"></span>
            <span style="font-weight:600;color:#0f172a;">${params.name}</span><br/>
            <span style="color:${C_AXIS};padding-left:14px;">Cantidad: </span>
            <span style="font-weight:700;color:${color};">${params.value.toLocaleString("es-AR")}</span>`;
        },
      },
      legend: {
        bottom: 0,
        left: "center",
        itemWidth: 10,
        itemHeight: 10,
        borderRadius: 50,
        textStyle: { fontSize: 11, color: C_AXIS, fontFamily: "inherit" },
      },
      series: [
        {
          type: "pie",
          radius: ["42%", "70%"],
          center: ["50%", "46%"],
          padAngle: 3,
          itemStyle: { borderRadius: 6 },
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "inherit",
            formatter: "{d}%",
            color: "#0f172a",
          },
          labelLine: {
            length: 10,
            length2: 8,
            lineStyle: { color: "rgba(148, 163, 184, 0.6)", width: 1.5 },
          },
          emphasis: {
            scale: true,
            scaleSize: 6,
            label: { fontSize: 14 },
            itemStyle: { shadowBlur: 12, shadowColor: "rgba(0,0,0,0.15)" },
          },
          data: [
            { name: "Masculino", value: data.male, itemStyle: { color: C_MALE } },
            { name: "Femenino",  value: data.female, itemStyle: { color: C_FEMALE } },
          ],
        },
      ],
    };

    chart.setOption(option, true);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [data]);

  return (
    <ChartCard title="Distribución por Género" subtitle="Total de deportistas activos por género">
      <div ref={chartRef} style={{ width: "100%", height: "190px" }} />
    </ChartCard>
  );
}

// ---------------- AGE DISTRIBUTION — histogram ----------------

interface AgeDistributionChartProps {
  data: { range: string; count: number }[];
}

export function AgeDistributionChart({ data }: AgeDistributionChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    const chart = echarts.init(chartRef.current, "light");

    const maxCount = Math.max(...data.map((d) => d.count));

    const option = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "none" },
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        borderColor: "rgba(148, 163, 184, 0.35)",
        borderWidth: 1,
        textStyle: { fontSize: 12, color: "#0f172a" },
        formatter: (params: any[]) => {
          const p = params[0];
          return `<span style="font-weight:600;color:#0f172a;">${p.name}</span><br/>
            <span style="color:${C_AXIS};">Deportistas: </span>
            <span style="font-weight:700;color:${C_BLUE_MAIN};">${p.value.toLocaleString("es-AR")}</span>`;
        },
      },
      grid: { left: 40, right: 16, top: 28, bottom: 32 },
      xAxis: {
        type: "category",
        data: data.map((d) => d.range),
        axisLine: { lineStyle: { color: "hsl(215, 30%, 88%)" } },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 10,
          color: C_AXIS,
          fontFamily: "inherit",
          interval: 0,
        },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "hsl(215, 30%, 93%)", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 10,
          color: C_AXIS,
          fontFamily: "inherit",
          formatter: (v: number) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
        },
      },
      series: [
        {
          type: "bar",
          data: data.map((d) => ({
            value: d.count,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: C_BLUE_MAIN },
                { offset: 1, color: "hsl(215, 85%, 76%)" },
              ]),
              borderRadius: [5, 5, 0, 0],
              opacity: d.count === maxCount ? 1 : 0.82,
            },
          })),
          barMaxWidth: 36,
          label: {
            show: true,
            position: "top",
            fontSize: 10,
            fontWeight: 600,
            color: C_AXIS,
            fontFamily: "inherit",
            formatter: (params: any) =>
              params.value > 0 ? params.value.toLocaleString("es-AR") : "",
          },
          emphasis: {
            itemStyle: {
              opacity: 1,
              shadowBlur: 8,
              shadowColor: "rgba(37, 99, 235, 0.25)",
            },
          },
        },
      ],
    };

    chart.setOption(option, true);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [data]);

  return (
    <ChartCard title="Distribución por Edad" subtitle="Pirámide etaria de deportistas">
      <div ref={chartRef} style={{ width: "100%", height: "190px" }} />
    </ChartCard>
  );
}

// ---------------- PROVINCE RANKING — horizontal bar ----------------

interface ProvinceRankingChartProps {
  data: { nombre: string; totalAthletes: number; totalClubs: number }[];
}

export function ProvinceRankingChart({ data }: ProvinceRankingChartProps) {
  const top8 = [...data]
    .sort((a, b) => b.totalAthletes - a.totalAthletes)
    .slice(0, 8);

  return (
    <ChartCard title="Top Provincias" subtitle="Por cantidad de atletas registrados">
      <BarChart
        layout="horizontal"
        height={190}
        series={[{
          data: top8.map((d) => d.totalAthletes),
          color: C_BLUE_LIGHT,
          valueFormatter: (v) => (v ?? 0).toLocaleString("es-AR"),
        }]}
        yAxis={[{
          data: top8.map((d) => d.nombre),
          scaleType: "band",
          width: 120,
          ...axisStyle,
        }]}
        xAxis={[{ ...axisStyle, tickNumber: 4 }]}
        borderRadius={6}
        margin={{ left: 4, right: 12, top: 4, bottom: 20 }}
        sx={{
          "& .MuiChartsAxis-line": { display: "none" },
          "& .MuiChartsAxis-tick": { display: "none" },
          "& .MuiChartsLegend-root": { display: "none" },
        }}
      />
    </ChartCard>
  );
}

// ---------------- GENDER PER SPORT — stacked horizontal ----------------

interface GenderPerSportChartProps {
  data: { sport: string; count: number }[];
}

export function GenderPerSportChart({ data }: GenderPerSportChartProps) {
  const sorted = [...data].sort((a, b) => b.count - a.count);

  return (
    <ChartCard title="Deportistas por Deporte" subtitle="Cantidad total de deportistas por disciplina">
      <BarChart
        layout="horizontal"
        height={200}
        series={[
          {
            data: sorted.map((d) => d.count),
            color: C_BLUE_LIGHT,
            valueFormatter: (v) => (v ?? 0).toLocaleString("es-AR"),
          },
        ]}
        yAxis={[{
          data: sorted.map((d) => d.sport),
          scaleType: "band",
          width: 110,
          ...axisStyle,
        }]}
        xAxis={[{ ...axisStyle, tickNumber: 3 }]}
        borderRadius={4}
        margin={{ left: 4, right: 8, top: 4, bottom: 24 }}
        sx={{
          "& .MuiChartsAxis-line": { display: "none" },
          "& .MuiChartsAxis-tick": { display: "none" },
          "& .MuiChartsLegend-root": { display: "none" },
        }}
      />
    </ChartCard>
  );
}
