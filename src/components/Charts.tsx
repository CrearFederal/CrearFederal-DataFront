import * as echarts from 'echarts';
import 'echarts-gl';
import { useEffect, useRef } from 'react';
import { Volleyball, Users, BarChart3, MapPin, Building2 } from 'lucide-react';
import type { ProvinciaRanking } from "../types/Provincias";
import type { TopClubRankingItem } from "../types/Clubes";

const C_BLUE_MAIN = "hsl(215, 85%, 52%)";
const C_FEMALE = "hsl(330, 65%, 58%)";
const C_MALE = "hsl(215, 85%, 52%)";
const C_AXIS = "hsl(215, 20%, 55%)";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function ChartCard({ title, subtitle, icon, children, className = "" }: ChartCardProps) {
  return (
    <div className={`rounded-xl border border-border bg-card p-4 flex flex-col ${className}`}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          {icon}
          <span>{title}</span>
        </h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

interface AthletesPerSportChartProps {
  data: { sport: string; male: number; female: number }[];
}

export function AthletesPerSportChart({ data }: AthletesPerSportChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const topSports = [...data]
      .sort((a, b) => (b.male + b.female) - (a.male + a.female))
      .slice(0, 5);

    const chart = echarts.init(chartRef.current, "light");
    const sports = topSports.map((d) => d.sport);
    const genders = ["Masculino", "Femenino"];
    const bar3dData: [number, number, number][] = [];

    topSports.forEach((item, sportIndex) => {
      bar3dData.push([sportIndex, 0, item.male]);
      bar3dData.push([sportIndex, 1, item.female]);
    });

    chart.setOption({
      backgroundColor: "transparent",
      tooltip: {
        confine: true,
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        borderColor: "rgba(148, 163, 184, 0.35)",
        borderWidth: 1,
        textStyle: { fontSize: 12, color: "#0f172a" },
        formatter: (params: any) => {
          if (params.componentSubType !== "bar3D") return "";
          const sportIdx = params.value[0];
          const genderIdx = params.value[1];
          const count = params.value[2];
          const sport = sports[sportIdx] || "Deporte";
          const valueColor = genderIdx === 0 ? C_MALE : C_FEMALE;
          return `<span style="color:${valueColor};font-weight:700;">${sport}</span><br/><span style="color:#0f172a;font-weight:400;">Deportistas: </span><span style="color:${valueColor};font-weight:700;">${count.toLocaleString('es-AR')}</span>`;
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
        axisLine: { lineStyle: { color: "rgba(100, 116, 139, 0.45)" } },
        axisPointer: { show: false },
        splitLine: { lineStyle: { color: "rgba(100, 116, 139, 0.18)" } },
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
          main: { intensity: 1.1, shadow: false },
          ambient: { intensity: 0.4 },
        },
      },
      xAxis3D: {
        type: "category",
        data: sports,
        axisLabel: { interval: 0, fontSize: 11, color: C_AXIS, rotate: 25, margin: 16 },
      },
      yAxis3D: {
        type: "category",
        data: genders,
        axisLabel: { color: C_AXIS, fontSize: 11, margin: 10 },
      },
      zAxis3D: {
        type: "value",
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
              return genderIdx === 0 ? `{maleTag|${count}}` : `{femaleTag|${count}}`;
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
            color: (params: { value: [number, number, number] }) => (params.value[1] === 0 ? C_MALE : C_FEMALE),
            opacity: 0.95,
            borderWidth: 0.6,
            borderColor: "rgba(15, 23, 42, 0.45)",
          },
          emphasis: {
            label: { show: false },
            itemStyle: { opacity: 1 },
          },
        },
      ],
    }, true);

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

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      chartDom.removeEventListener("mousedown", blockChartInteraction, true);
      chartDom.removeEventListener("mouseup", blockChartInteraction, true);
      chartDom.removeEventListener("click", blockChartInteraction, true);
      chartDom.removeEventListener("dblclick", blockChartInteraction, true);
      chartDom.removeEventListener("contextmenu", blockChartInteraction, true);
      chartDom.removeEventListener("wheel", blockChartInteraction, true);
      chartDom.removeEventListener("touchstart", blockChartInteraction, true);
      chartDom.removeEventListener("touchmove", blockChartInteraction, true);
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [data]);

  return (
    <ChartCard
      title="Top Deportes"
      subtitle="Eje X: Deportes · Eje Y: Género · Eje Z: Cantidad de deportistas"
      icon={<Volleyball className="h-4 w-4 text-primary" />}
    >
      <div ref={chartRef} style={{ width: "100%", height: "480px", position: "relative" }} />
    </ChartCard>
  );
}

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

    chart.setOption({
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
            <span style="font-weight:400;color:#0f172a;font-size:12px;">${params.name}</span><br/>
            <span style="color:${C_AXIS};padding-left:14px;font-size:11px;">Cantidad: </span>
            <span style="font-weight:900;color:${color};font-size:15px;">${params.value.toLocaleString("es-AR")}</span>`;
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
          radius: ["52%", "80%"],
          center: ["50%", "50%"],
          padAngle: 2,
          itemStyle: { borderRadius: 10 },
          label: {
            show: true,
            position: "inside",
            formatter: (params: any) => `${Math.round(params.percent ?? 0)}%`,
            color: "#ffffff",
            fontSize: 24,
            fontWeight: 800,
            fontFamily: "inherit",
            textBorderColor: "rgba(15, 23, 42, 0.35)",
            textBorderWidth: 2,
            textShadowBlur: 4,
            textShadowColor: "rgba(0, 0, 0, 0.25)",
            align: "center",
            verticalAlign: "middle",
          },
          labelLine: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 8,
            label: { fontSize: 26, fontWeight: 900, color: "#ffffff" },
            itemStyle: { shadowBlur: 12, shadowColor: "rgba(0,0,0,0.15)" },
          },
          data: [
            { name: "Masculino", value: data.male, itemStyle: { color: C_MALE } },
            { name: "Femenino", value: data.female, itemStyle: { color: C_FEMALE } },
          ],
        },
      ],
    }, true);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [data]);

  return (
    <ChartCard
      title="Distribución por Género"
      subtitle="Porcentajes de deportistas activos por género"
      icon={<Users className="h-4 w-4 text-primary" />}
    >
      <div ref={chartRef} style={{ width: "100%", height: "380px" }} />
    </ChartCard>
  );
}

const BIN_WIDTH = 5;

function buildHistogramBins(ages: number[]): { label: string; count: number }[] {
  if (ages.length === 0) return [];
  const minAge = Math.floor(Math.min(...ages) / BIN_WIDTH) * BIN_WIDTH;
  const maxAge = Math.floor(Math.max(...ages) / BIN_WIDTH) * BIN_WIDTH;
  const bins: { label: string; count: number }[] = [];
  for (let lo = minAge; lo <= maxAge; lo += BIN_WIDTH) {
    const hi = lo + BIN_WIDTH - 1;
    bins.push({ label: `${lo}-${hi}`, count: 0 });
  }
  for (const age of ages) {
    const idx = Math.floor((age - minAge) / BIN_WIDTH);
    if (idx >= 0 && idx < bins.length) bins[idx].count++;
  }
  return bins;
}

interface AgeDistributionChartProps {
  ages: number[];
}

export function AgeDistributionChart({ ages }: AgeDistributionChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const bins = buildHistogramBins(ages);

  useEffect(() => {
    if (!chartRef.current || bins.length === 0) return;

    const chart = echarts.init(chartRef.current, "light");

    chart.setOption({
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
          return `<span style="font-weight:600;color:#0f172a;">${p.name} años</span><br/>
            <span style="color:${C_AXIS};">Deportistas: </span>
            <span style="font-weight:700;color:${C_BLUE_MAIN};">${p.value.toLocaleString("es-AR")}</span>`;
        },
      },
      grid: { left: 40, right: 16, top: 28, bottom: 32 },
      xAxis: {
        type: "category",
        data: bins.map((b) => b.label),
        axisLine: { lineStyle: { color: "hsl(215, 30%, 88%)" } },
        axisTick: { show: false },
        axisLabel: { fontSize: 10, color: C_AXIS, fontFamily: "inherit", interval: 0 },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "hsl(215, 20%, 85%)", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 10,
          color: C_AXIS,
          fontFamily: "inherit",
          formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)),
        },
      },
      series: [
        {
          type: "bar",
          data: bins.map((b) => ({ value: b.count })),
          barCategoryGap: "1%",
          itemStyle: { color: C_BLUE_MAIN },
          label: {
            show: true,
            position: "inside",
            fontSize: 10,
            fontWeight: 600,
            color: "#ffffff",
            fontFamily: "inherit",
            formatter: (params: any) => (params.value > 0 ? params.value.toLocaleString("es-AR") : ""),
          },
          emphasis: { itemStyle: { opacity: 0.85 } },
        },
      ],
    }, true);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [bins]);

  return (
    <ChartCard
      title="Distribución por Edad"
      subtitle="Histograma etario de todos los deportistas activos"
      icon={<BarChart3 className="h-4 w-4 text-primary" />}
    >
      <div ref={chartRef} style={{ width: "100%", height: "190px" }} />
    </ChartCard>
  );
}

interface ProvinceRankingChartProps {
  data: ProvinciaRanking[];
}

export function ProvinceRankingChart({ data }: ProvinceRankingChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const top10 = [...data].sort((a, b) => b.totalAthletes - a.totalAthletes).slice(0, 10).reverse();

  const getDisplayName = (nombre: string) => 
    nombre === "Ciudad Autónoma de Buenos Aires (CABA)" ? "CABA" : nombre;

  useEffect(() => {
    if (!chartRef.current || top10.length === 0) return;

    const chart = echarts.init(chartRef.current, "light");
    const labels = top10.map((d) => getDisplayName(d.nombre));
    const maleData = top10.map((d) => d.totalHombres);
    const femaleData = top10.map((d) => d.totalMujeres);

    const insideLabel = () => ({
      show: true,
      position: "inside" as const,
      fontSize: 10,
      fontWeight: 600,
      color: "#ffffff",
      fontFamily: "inherit",
      overflow: "truncate" as const,
      formatter: (params: any) => (params.value > 0 ? params.value.toLocaleString("es-AR") : ""),
    });

    chart.setOption({
      backgroundColor: "transparent",
      legend: {
        bottom: 0,
        left: "center",
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 11, color: C_AXIS, fontFamily: "inherit" },
        data: ["Masculino", "Femenino"],
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "none" },
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        borderColor: "rgba(148, 163, 184, 0.35)",
        borderWidth: 1,
        textStyle: { fontSize: 12, color: "#0f172a" },
        formatter: (params: any[]) => {
          const displayName = params[0].name;
          const item = top10.find((d) => getDisplayName(d.nombre) === displayName);
          if (!item) return "";
          const total = item.totalHombres + item.totalMujeres;
          return `<span style="font-weight:700;color:#0f172a;font-size:13px;">${displayName}</span><br/>
            <span style="color:${C_AXIS};font-size:11px;">Total de deportistas: </span>
            <span style="font-weight:900;color:#0f172a;font-size:14px;">${total.toLocaleString("es-AR")}</span><br/>
            <span style="color:${C_AXIS};font-size:11px;">En </span>
            <span style="font-weight:700;color:#0f172a;font-size:12px;">${item.totalClubs.toLocaleString("es-AR")}</span>
            <span style="color:${C_AXIS};font-size:11px;"> clubes</span><br/>
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${C_MALE};margin-right:5px;"></span>
            <span style="color:${C_AXIS};font-size:11px;">Masculino: </span>
            <span style="font-weight:700;color:${C_MALE};">${item.totalHombres.toLocaleString("es-AR")}</span><br/>
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${C_FEMALE};margin-right:5px;"></span>
            <span style="color:${C_AXIS};font-size:11px;">Femenino: </span>
            <span style="font-weight:700;color:${C_FEMALE};">${item.totalMujeres.toLocaleString("es-AR")}</span>`;
        },
      },
      grid: { left: 120, right: 32, top: 12, bottom: 52 },
      xAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "hsl(215, 20%, 85%)", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 10,
          color: C_AXIS,
          fontFamily: "inherit",
          formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)),
        },
      },
      yAxis: {
        type: "category",
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontSize: 11, color: "#0f172a", fontWeight: 500, fontFamily: "inherit" },
      },
      series: [
        {
          name: "Masculino",
          type: "bar",
          stack: "total",
          barMaxWidth: 28,
          data: maleData,
          itemStyle: { color: C_MALE },
          label: insideLabel(),
          emphasis: { itemStyle: { opacity: 0.85 } },
          animationDuration: 800,
          animationEasing: "cubicOut",
        },
        {
          name: "Femenino",
          type: "bar",
          stack: "total",
          barMaxWidth: 28,
          data: femaleData,
          itemStyle: { color: C_FEMALE, borderRadius: [0, 8, 8, 0] },
          label: insideLabel(),
          emphasis: { itemStyle: { opacity: 0.85 } },
          animationDuration: 800,
          animationEasing: "cubicOut",
        },
      ],
    }, true);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [top10]);

  return (
    <ChartCard
      title="Top Provincias"
      subtitle="Por cantidad de deportistas y distribución por género"
      icon={<MapPin className="h-4 w-4 text-primary" />}
    >
      <div ref={chartRef} style={{ width: "100%", height: "360px" }} />
    </ChartCard>
  );
}

interface ClubRankingChartProps {
  data: TopClubRankingItem[];
}

export function ClubRankingChart({ data }: ClubRankingChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const top10 = [...data].sort((a, b) => b.totalDeportistas - a.totalDeportistas).slice(0, 10).reverse();

  useEffect(() => {
    if (!chartRef.current || top10.length === 0) return;

    const chart = echarts.init(chartRef.current, "light");
    const labels = top10.map((d) => d.nombre_corto || d.nombre);
    const totals = top10.map((d) => d.totalDeportistas);

    const insideLabel = () => ({
      show: true,
      position: "inside" as const,
      fontSize: 10,
      fontWeight: 600,
      color: "#ffffff",
      fontFamily: "inherit",
      overflow: "truncate" as const,
      formatter: (params: any) => (params.value > 0 ? params.value.toLocaleString("es-AR") : ""),
    });

    chart.setOption({
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "none" },
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        borderColor: "rgba(148, 163, 184, 0.35)",
        borderWidth: 1,
        textStyle: { fontSize: 12, color: "#0f172a" },
        formatter: (params: any[]) => {
          const name = params[0].name;
          const item = top10.find((d) => (d.nombre_corto || d.nombre) === name);
          if (!item) return "";
          return `<span style="font-weight:700;color:${C_MALE};font-size:13px;">${item.nombre_corto || item.nombre}</span><br/>
            <span style="color:${C_AXIS};font-size:11px;">Total: </span>
            <span style="font-weight:900;color:${C_MALE};font-size:14px;">${item.totalDeportistas.toLocaleString("es-AR")}</span><br/>
            <span style="font-size:11px;">${item.nombreMunicipio || ""} - ${item.nombreProvincia || ""}</span>`;
        },
      },
      grid: { left: 120, right: 32, top: 12, bottom: 24 },
      xAxis: {
        type: "value",
        splitLine: { lineStyle: { color: "hsl(215, 20%, 85%)", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 10,
          color: C_AXIS,
          fontFamily: "inherit",
          formatter: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)),
        },
      },
      yAxis: {
        type: "category",
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontSize: 11, color: "#0f172a", fontWeight: 500, fontFamily: "inherit" },
      },
      series: [
        {
          name: "Deportistas",
          type: "bar",
          barMaxWidth: 28,
          data: totals,
          itemStyle: { color: C_MALE, borderRadius: [0, 8, 8, 0] },
          label: insideLabel(),
          emphasis: { itemStyle: { opacity: 0.85 } },
          animationDuration: 800,
          animationEasing: "cubicOut",
        },
      ],
    }, true);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [top10]);

  return (
    <ChartCard
      title="Top Clubes"
      subtitle="Por cantidad de deportistas registrados"
      icon={<Building2 className="h-4 w-4 text-primary" />}
    >
      <div ref={chartRef} style={{ width: "100%", height: "360px" }} />
    </ChartCard>
  );
}