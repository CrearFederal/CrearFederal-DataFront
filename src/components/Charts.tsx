import * as echarts from 'echarts';
import 'echarts-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Volleyball, Users, BarChart3, MapPin, Building2, Play, Pause, Eye, Globe } from 'lucide-react';
import type { MunicipiosTop10ContextoResponse } from "../types/Municipios";
import type { ProvinciasTop10ContextoResponse } from "../types/Provincias";
import type { TopClubRankingItem } from "../types/Clubes";

const C_BLUE_MAIN = "hsl(215, 85%, 52%)";
const C_FEMALE = "hsl(330, 65%, 58%)";
const C_MALE = "hsl(215, 85%, 52%)";
const C_AXIS = "hsl(215, 20%, 55%)";
const C_GRAY_MALE = "hsl(215, 10%, 70%)";
const C_GRAY_FEMALE = "hsl(215, 8%, 78%)";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

function ChartCard({ title, subtitle, icon, children, className = "", headerAction }: ChartCardProps) {
  return (
    <div className={`rounded-xl border border-border bg-card p-4 flex flex-col ${className}`}>
      <div className="mb-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </h3>
          {headerAction}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

interface AthletesPerSportChartProps {
  data: { sport: string; male: number; female: number }[];
  autoRotate?: boolean;
  height?: number;
}

export function AthletesPerSportChart({ data, autoRotate = true, height = 480 }: AthletesPerSportChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const [isPaused, setIsPaused] = useState(!autoRotate);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const topSports = [...data]
      .sort((a, b) => (b.male + b.female) - (a.male + a.female))
      .slice(0, 5);

    const chart = echarts.init(chartRef.current, "light");
    chartInstanceRef.current = chart;
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
          autoRotate: !isPaused,
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
  }, [data, isPaused]);

  return (
    <ChartCard
      title="Top Deportes"
      subtitle="Eje X: Deportes · Eje Y: Género · Eje Z: Cantidad de deportistas"
      icon={<Volleyball className="h-4 w-4 text-primary" />}
    >
      <div ref={chartRef} style={{ width: "100%", height: `${height}px`, position: "relative" }} />
      {autoRotate && (
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="self-start p-1 rounded-lg text-primary hover:bg-primary hover:text-white transition-colors flex items-center gap-1.5"
          title={isPaused ? "Reanudar rotación" : "Pausar rotación"}
        >
          {isPaused ? (
            <Play className="h-5 w-5" />
          ) : (
            <Pause className="h-5 w-5" />
          )}
        </button>
      )}
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
  subtitle?: string;
}

export function GenderDistributionChart({ data, subtitle = "Porcentajes de deportistas activos por género" }: GenderDistributionChartProps) {
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
          radius: ["56%", "84%"],
          center: ["50%", "44%"],
          padAngle: 2,
          itemStyle: { borderRadius: 10 },
          label: {
            show: true,
            position: "inside",
            formatter: (params: any) => `${Math.round(params.percent ?? 0)}%`,
            color: "#ffffff",
            fontSize: 14,
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
            scaleSize: 10,
            label: { fontSize: 16, fontWeight: 900, color: "#ffffff" },
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

    const ro = new ResizeObserver(() => chart.resize());
    if (chartRef.current) ro.observe(chartRef.current);

    return () => {
      window.removeEventListener("resize", handleResize);
      ro.disconnect();
      chart.dispose();
    };
  }, [data]);

  return (
    <ChartCard
      title="Distribución por Género"
      subtitle={subtitle}
      icon={<Users className="h-4 w-4 text-primary" />}
    >
      <div ref={chartRef} className="flex-1 min-h-[360px]" style={{ width: "100%" }} />
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
  siblingAges?: number[];
  fillHeight?: boolean;
  showCard?: boolean;
  genero?: "femenino" | "masculino";
}

export function AgeDistributionChart({ ages, siblingAges, fillHeight = false, showCard = true, genero }: AgeDistributionChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const bins = useMemo(() => buildHistogramBins(ages), [ages]);
  const siblingBins = useMemo(() => buildHistogramBins(siblingAges ?? []), [siblingAges]);

  const sharedYMax = useMemo(() => {
    const myMax = bins.length > 0 ? Math.max(...bins.map((b) => b.count)) : 0;
    const sibMax = siblingBins.length > 0 ? Math.max(...siblingBins.map((b) => b.count)) : 0;
    const raw = Math.max(myMax, sibMax);
    if (!raw) return undefined;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    return Math.ceil(raw / mag) * mag;
  }, [bins, siblingBins]);

  const barColor = genero === "femenino" ? C_FEMALE : C_MALE;
  const tooltipColor = genero === "femenino" ? C_FEMALE : C_MALE;

  useEffect(() => {
    if (!chartRef.current || bins.length === 0) return;

    const chartDom = chartRef.current;
    let chart: echarts.ECharts | null = null;
    let disposed = false;

    const initChart = () => {
      if (disposed || !chartDom.isConnected) return false;
      if (chartDom.clientWidth === 0 || chartDom.clientHeight === 0) return false;

      const containerWidth = chartDom.clientWidth;
      const xInterval = containerWidth < 280 ? 3 : containerWidth < 380 ? 1 : 0;

      chart = echarts.init(chartDom, "light");

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
              <span style="font-weight:700;color:${tooltipColor};">${p.value.toLocaleString("es-AR")}</span>`;
          },
        },
        grid: { left: 40, right: 16, top: 28, bottom: 32 },
        xAxis: {
          type: "category",
          data: bins.map((b) => b.label),
          axisLine: { lineStyle: { color: "hsl(215, 30%, 88%)" } },
          axisTick: { show: false },
          axisLabel: { fontSize: 10, color: C_AXIS, fontFamily: "inherit", interval: xInterval },
        },
        yAxis: {
          type: "value",
          max: sharedYMax,
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
            itemStyle: { color: barColor },
            animationDuration: 1200,
            animationDurationUpdate: 900,
            animationDelay: (idx: number) => idx * 35,
            animationDelayUpdate: (idx: number) => idx * 35,
            animationEasing: "cubicOut",
            animationEasingUpdate: "cubicOut",
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

      const handleResize = () => chart?.resize();
      window.addEventListener("resize", handleResize);

      cleanup = () => {
        window.removeEventListener("resize", handleResize);
        chart?.dispose();
        chart = null;
      };

      return true;
    };

    let cleanup = () => {};

    if (!initChart()) {
      const observer = new ResizeObserver(() => {
        if (initChart()) {
          observer.disconnect();
        }
      });

      observer.observe(chartDom);

      const retryFrame = window.requestAnimationFrame(() => {
        if (initChart()) {
          observer.disconnect();
        }
      });

      cleanup = () => {
        window.cancelAnimationFrame(retryFrame);
        observer.disconnect();
        chart?.dispose();
        chart = null;
      };
    }

    return () => {
      disposed = true;
      cleanup();
    };
  }, [bins, barColor, tooltipColor, sharedYMax]);

  const chartContent = (
    <div
      className={fillHeight ? "flex-1 min-h-0" : ""}
      style={{ width: "100%", height: fillHeight ? "100%" : "190px" }}
    >
      <div ref={chartRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );

  if (!showCard) {
    return chartContent;
  }

  return (
    <ChartCard
      title="Distribución por Edad"
      subtitle="Histograma etario de todos los deportistas activos"
      icon={<BarChart3 className="h-4 w-4 text-primary" />}
      className={fillHeight ? "h-full" : ""}
    >
      {chartContent}
    </ChartCard>
  );
}

interface ProvinceRankingChartProps {
  data: ProvinciasTop10ContextoResponse | null;
  onBarClick?: (provinciaId: number) => void;
}

export function ProvinceRankingChart({ data, onBarClick }: ProvinceRankingChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const onBarClickRef = useRef(onBarClick);
  useEffect(() => { onBarClickRef.current = onBarClick; }, [onBarClick]);
  const top10 = useMemo(
    () => [...(data?.provincias ?? [])].sort((a, b) => a.posicion - b.posicion).slice(0, 10).reverse(),
    [data]
  );
  const provinciaLogueadaId = data?.provinciaLogueada?.id ?? null;

  const getDisplayName = (nombre: string) =>
    nombre === "Ciudad Autónoma de Buenos Aires (CABA)" ? "CABA" : nombre;

  const isHighlightedProvince = (provinciaId: number) => {
    if (!provinciaLogueadaId) return true;
    return provinciaId === provinciaLogueadaId;
  };

  useEffect(() => {
    if (!chartRef.current || top10.length === 0) return;

    const chart = echarts.init(chartRef.current, "light");
    const labels = top10.map((d) => getDisplayName(d.nombre));
    const maleData = top10.map((d) => {
      const highlighted = isHighlightedProvince(d.id);
      return {
        value: d.totalHombres,
        itemStyle: { color: highlighted ? C_MALE : C_GRAY_MALE },
      };
    });
    const femaleData = top10.map((d) => {
      const highlighted = isHighlightedProvince(d.id);
      return {
        value: d.totalMujeres,
        itemStyle: {
          color: highlighted ? C_FEMALE : C_GRAY_FEMALE,
          borderRadius: [0, 8, 8, 0],
        },
      };
    });

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
        textStyle: { fontSize: 10, color: C_AXIS },
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
          const displayName = params[0].axisValue;
          const item = top10.find((d) => getDisplayName(d.nombre) === displayName);
          if (!item) return "";

          const highlighted = isHighlightedProvince(item.id);
          const maleColor = highlighted ? C_MALE : C_GRAY_MALE;
          const femaleColor = highlighted ? C_FEMALE : C_GRAY_FEMALE;
          const total = item.totalHombres + item.totalMujeres;
          return `<span style="font-weight:700;color:#0f172a;font-size:13px;">#${item.posicion} ${displayName}</span><br/>
            <span style="color:${C_AXIS};font-size:11px;">Total de deportistas: </span>
            <span style="font-weight:900;color:#0f172a;font-size:14px;">${total.toLocaleString("es-AR")}</span><br/>
            <span style="color:${C_AXIS};font-size:11px;">En </span>
            <span style="font-weight:700;color:#0f172a;font-size:12px;">${item.totalClubs.toLocaleString("es-AR")}</span>
            <span style="color:${C_AXIS};font-size:11px;"> clubes</span><br/>
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${maleColor};margin-right:5px;"></span>
            <span style="color:${C_AXIS};font-size:11px;">Masculino: </span>
            <span style="font-weight:700;color:${maleColor};">${item.totalHombres.toLocaleString("es-AR")}</span><br/>
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${femaleColor};margin-right:5px;"></span>
            <span style="color:${C_AXIS};font-size:11px;">Femenino: </span>
            <span style="font-weight:700;color:${femaleColor};">${item.totalMujeres.toLocaleString("es-AR")}</span>`;
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
        triggerEvent: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontFamily: "inherit",
          cursor: onBarClick ? "pointer" : "default",
          formatter: (value: string, index: number) => {
            const item = top10[index];
            if (!item) return value;
            const markToken = isHighlightedProvince(item.id) ? "markActive" : "markIdle";
            const nameToken = isHighlightedProvince(item.id) ? "name" : "nameMuted";
            return `{${markToken}|●} {pos|#${item.posicion}} {${nameToken}|${value}}`;
          },
          rich: {
            markActive: {
              color: C_BLUE_MAIN,
              fontWeight: 800,
              fontSize: 10,
            },
            markIdle: {
              color: "rgba(0, 0, 0, 0)",
              fontWeight: 800,
              fontSize: 10,
            },
            pos: {
              color: C_BLUE_MAIN,
              fontWeight: 700,
              fontSize: 11,
            },
            name: {
              color: "#0f172a",
              fontWeight: 600,
              fontSize: 11,
            },
            nameMuted: {
              color: "hsl(215, 10%, 52%)",
              fontWeight: 500,
              fontSize: 11,
            },
          },
        },
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
          cursor: onBarClick ? "pointer" : "default",
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
          cursor: onBarClick ? "pointer" : "default",
          animationDuration: 800,
          animationEasing: "cubicOut",
        },
      ],
    }, true);

    chart.on("click", (params: any) => {
      const name = params.componentType === "yAxis" ? params.value : params.name;
      const item = top10.find((d) => getDisplayName(d.nombre) === name);
      if (item) onBarClickRef.current?.(item.id);
    });

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [top10, provinciaLogueadaId]);

  return (
    <ChartCard
      title="Top Provincias"
      subtitle="Por cantidad de deportistas y distribución por género"
      icon={<MapPin className="h-4 w-4 text-primary" />}
      headerAction={
        onBarClick ? (
          <div className="flex items-center gap-1 text-muted-foreground/60">
            <Eye className="h-3.5 w-3.5" />
            <span className="text-[9px] font-medium uppercase tracking-wide">click en provincia para ver</span>
          </div>
        ) : undefined
      }
    >
      <div ref={chartRef} style={{ width: "100%", height: "360px" }} />
    </ChartCard>
  );
}

interface ClubRankingChartProps {
  data: TopClubRankingItem[];
  height?: number;
  customHeight?: number;
  onClubClick?: (clubId: number) => void;
}

export function ClubRankingChart({ data, height = 360, customHeight, onClubClick }: ClubRankingChartProps) {
  const finalHeight = customHeight ?? height;
  const chartRef = useRef<HTMLDivElement>(null);
  const top10 = useMemo(
    () => [...data].sort((a, b) => b.totalDeportistas - a.totalDeportistas).slice(0, 10).reverse(),
    [data]
  );

  useEffect(() => {
    if (!chartRef.current || top10.length === 0) return;

    const chart = echarts.init(chartRef.current, "light");
    const labels = top10.map((d) => d.nombre_corto || d.nombre);
    const totals = top10.map((d) => ({ value: d.totalDeportistas, id_club: d.id_club }));
    const initialTotals = totals.map((item) => ({ value: 0, id_club: item.id_club }));

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
      grid: { left: 90, right: 20, top: 12, bottom: 24 },
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
          data: initialTotals,
          itemStyle: { color: C_MALE, borderRadius: [0, 8, 8, 0] },
          label: insideLabel(),
          emphasis: { itemStyle: { opacity: 0.85 } },
          animationDuration: 900,
          animationDurationUpdate: 1100,
          animationDelay: (idx: number) => idx * 90,
          animationDelayUpdate: (idx: number) => idx * 90,
          animationEasing: "cubicOut",
          animationEasingUpdate: "cubicOut",
        },
      ],
    },true);

    const handleChartClick = (params: any) => {
      const clubId = params?.data?.id_club ?? top10[params?.dataIndex ?? -1]?.id_club;

      if (typeof clubId === "number" && onClubClick) {
        onClubClick(clubId);
      }
    };

    chart.on("click", handleChartClick);

  const dataRevealFrame = window.setTimeout(() => {
    chart.setOption(
      {
        series: [
          {
            name: "Deportistas",
            data: totals,
          },
        ],
      },
      false,
      true
    );
  }, 80);

  const handleResize = () => chart.resize();
  const chartContainer = chartRef.current;
  const resizeObserver = typeof ResizeObserver !== "undefined"
    ? new ResizeObserver(() => chart.resize())
    : null;

  resizeObserver?.observe(chartContainer);
  window.addEventListener("resize", handleResize);

  const initialResizeFrame = window.requestAnimationFrame(() => {
    chart.resize();
  });

  return () => {
    window.clearTimeout(dataRevealFrame);
    chart.off("click", handleChartClick);
    resizeObserver?.disconnect();
    window.cancelAnimationFrame(initialResizeFrame);
    window.removeEventListener("resize", handleResize);
    chart.dispose();
  };
}, [top10, finalHeight]);

return (
  <ChartCard
    title="Top Clubes"
    subtitle="Por cantidad de deportistas registrados"
    icon={<Building2 className="h-4 w-4 text-primary" />}
  >
    <div ref={chartRef} style={{ width: "100%", height: `${finalHeight}px` }} />
  </ChartCard>
);
}

interface DeporteBarItem {
  id_deporte: number;
  nombre: string;
  totalDeportistas: number;
  totalHombres: number;
  totalMujeres: number;
}

interface DeporteProvinciasChartData {
  deporte: { id: number; nombre: string };
  totalDeportistas: number;
  totalProvincias: number;
  provincias: Array<{
    id_provincia: number;
    nombre: string;
    totalDeportistas: number;
    totalClubes: number;
    totalMujeres: number;
    totalHombres: number;
    porcentaje: number;
  }>;
}

interface DeporteCoverageChartProps {
  deportes: DeporteBarItem[];
  /** Single-sport federation: hide the sport list and show only the provincial coverage panel */
  singleDeporte?: boolean;
  selectedId: number | null;
  provinciasData: DeporteProvinciasChartData | null;
  provinciasLoading: boolean;
  onDeporteClick: (id: number) => void;
  onOpenHeatmap?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function DeporteCoverageChart({ deportes, singleDeporte = false, selectedId, provinciasData, provinciasLoading, onDeporteClick, onOpenHeatmap }: DeporteCoverageChartProps) {
  const deportesChartRef = useRef<HTMLDivElement>(null);
  const provinciasChartRef = useRef<HTMLDivElement>(null);
  const onClickRef = useRef(onDeporteClick);
  useEffect(() => { onClickRef.current = onDeporteClick; }, [onDeporteClick]);

  useEffect(() => {
    if (singleDeporte || !deportesChartRef.current || deportes.length === 0) return;

    const sorted = [...deportes].sort((a, b) => a.totalDeportistas - b.totalDeportistas);
    const labels = sorted.map((d) => d.nombre);

    const maleData = sorted.map((d) => ({
      value: d.totalHombres,
      id_deporte: d.id_deporte,
      itemStyle: { color: selectedId === null || selectedId === d.id_deporte ? C_MALE : C_GRAY_MALE },
    }));

    const femaleData = sorted.map((d) => ({
      value: d.totalMujeres,
      id_deporte: d.id_deporte,
      itemStyle: {
        color: selectedId === null || selectedId === d.id_deporte ? C_FEMALE : C_GRAY_FEMALE,
        borderRadius: [0, 8, 8, 0],
      },
    }));

    const chart = echarts.init(deportesChartRef.current, "light");

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
          const dataIndex = params[0]?.dataIndex;
          const item = typeof dataIndex === "number" ? sorted[dataIndex] : undefined;
          if (!item) return "";
          const total = item.totalHombres + item.totalMujeres;
          const maleColor = selectedId === null || selectedId === item.id_deporte ? C_MALE : C_GRAY_MALE;
          const femaleColor = selectedId === null || selectedId === item.id_deporte ? C_FEMALE : C_GRAY_FEMALE;
          return `<span style="font-weight:700;color:#0f172a;font-size:13px;">${item.nombre}</span><br/>
            <span style="color:${C_AXIS};font-size:11px;">Total: </span>
            <span style="font-weight:900;color:#0f172a;font-size:14px;">${total.toLocaleString("es-AR")}</span><br/>
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${maleColor};margin-right:5px;"></span>
            <span style="color:${C_AXIS};font-size:11px;">Masculino: </span>
            <span style="font-weight:700;color:${maleColor};">${item.totalHombres.toLocaleString("es-AR")}</span><br/>
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${femaleColor};margin-right:5px;"></span>
            <span style="color:${C_AXIS};font-size:11px;">Femenino: </span>
            <span style="font-weight:700;color:${femaleColor};">${item.totalMujeres.toLocaleString("es-AR")}</span>`;
        },
      },
      grid: { left: 112, right: 16, top: 8, bottom: 24 },
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
        triggerEvent: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontFamily: "inherit",
          cursor: "pointer",
          formatter: (value: string, index: number) => {
            const item = sorted[index];
            const isActive = selectedId === null || selectedId === item?.id_deporte;
            return `{${isActive ? "name" : "nameMuted"}|${value}}`;
          },
          rich: {
            name: { color: "#0f172a", fontWeight: 600, fontSize: 11 },
            nameMuted: { color: "hsl(215, 10%, 52%)", fontWeight: 500, fontSize: 11 },
          },
        },
      },
      series: [
        {
          name: "Masculino",
          type: "bar",
          stack: "total",
          barMaxWidth: 22,
          data: maleData,
          label: {
            show: true,
            position: "inside" as const,
            fontSize: 9,
            fontWeight: 600,
            color: "#ffffff",
            fontFamily: "inherit",
            overflow: "truncate" as const,
            formatter: (params: any) => (params.value > 0 ? params.value.toLocaleString("es-AR") : ""),
          },
          emphasis: { itemStyle: { opacity: 0.85 } },
          cursor: "pointer",
          animationDuration: 800,
          animationEasing: "cubicOut",
        },
        {
          name: "Femenino",
          type: "bar",
          stack: "total",
          barMaxWidth: 22,
          data: femaleData,
          label: {
            show: true,
            position: "inside" as const,
            fontSize: 9,
            fontWeight: 600,
            color: "#ffffff",
            fontFamily: "inherit",
            overflow: "truncate" as const,
            formatter: (params: any) => (params.value > 0 ? params.value.toLocaleString("es-AR") : ""),
          },
          emphasis: { itemStyle: { opacity: 0.85 } },
          cursor: "pointer",
          animationDuration: 800,
          animationEasing: "cubicOut",
        },
      ],
    }, true);

    chart.on("click", (params: any) => {
      const item = sorted[params.dataIndex];
      if (item) onClickRef.current(item.id_deporte);
    });

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [deportes, selectedId, singleDeporte]);

  useEffect(() => {
    if (!provinciasChartRef.current || !provinciasData?.provincias?.length) return;

    const sorted = [...provinciasData.provincias].sort((a, b) => a.totalDeportistas - b.totalDeportistas);
    const labels = sorted.map((d) => d.nombre);

    const insideLabel = () => ({
      show: true,
      position: "inside" as const,
      fontSize: 9,
      fontWeight: 600,
      color: "#ffffff",
      fontFamily: "inherit",
      overflow: "truncate" as const,
      formatter: (params: any) => (params.value > 0 ? params.value.toLocaleString("es-AR") : ""),
    });

    const chart = echarts.init(provinciasChartRef.current, "light");

    chart.setOption({
      backgroundColor: "transparent",
      legend: {
        bottom: 0,
        left: "center",
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { fontSize: 10, color: C_AXIS },
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
          const dataIndex = params[0]?.dataIndex;
          const item = typeof dataIndex === "number" ? sorted[dataIndex] : undefined;
          if (!item) return "";
          const total = item.totalHombres + item.totalMujeres;
          return `<span style="font-weight:700;color:#0f172a;font-size:13px;">${item.nombre}</span><br/>
            <span style="color:${C_AXIS};font-size:11px;">Total: </span>
            <span style="font-weight:900;color:#0f172a;font-size:14px;">${total.toLocaleString("es-AR")}</span>
            <span style="color:${C_AXIS};font-size:11px;"> (${item.porcentaje}%)</span><br/>
            <span style="color:${C_AXIS};font-size:11px;">Clubes: </span>
            <span style="font-weight:700;color:#0f172a;">${item.totalClubes.toLocaleString("es-AR")}</span><br/>
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${C_MALE};margin-right:5px;"></span>
            <span style="color:${C_AXIS};font-size:11px;">Masculino: </span>
            <span style="font-weight:700;color:${C_MALE};">${item.totalHombres.toLocaleString("es-AR")}</span><br/>
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${C_FEMALE};margin-right:5px;"></span>
            <span style="color:${C_AXIS};font-size:11px;">Femenino: </span>
            <span style="font-weight:700;color:${C_FEMALE};">${item.totalMujeres.toLocaleString("es-AR")}</span>`;
        },
      },
      grid: { left: 128, right: 16, top: 8, bottom: 36 },
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
        axisLabel: { fontSize: 11, color: "#0f172a", fontWeight: 600, fontFamily: "inherit" },
      },
      series: [
        {
          name: "Masculino",
          type: "bar",
          stack: "total",
          barMaxWidth: 22,
          itemStyle: { color: C_MALE },
          data: sorted.map((d) => ({ value: d.totalHombres })),
          label: insideLabel(),
          emphasis: { itemStyle: { opacity: 0.85 } },
          animationDuration: 800,
          animationEasing: "cubicOut",
        },
        {
          name: "Femenino",
          type: "bar",
          stack: "total",
          barMaxWidth: 22,
          itemStyle: { color: C_FEMALE, borderRadius: [0, 8, 8, 0] },
          data: sorted.map((d) => ({ value: d.totalMujeres })),
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
  }, [provinciasData]);

  return (
    <ChartCard
      title="Cobertura Deportiva por Provincia"
      subtitle={singleDeporte ? "Provincias donde se practica tu deporte" : "Seleccioná un deporte para ver en qué provincias se practica"}
      icon={<Globe className="h-4 w-4 text-primary" />}
      headerAction={
        selectedId && provinciasData ? (
          <button
            type="button"
            onClick={onOpenHeatmap}
            className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/15"
          >
            <MapPin className="h-3.5 w-3.5" />
            Mapa de calor
          </button>
        ) : (
          <div className="flex items-center gap-1 text-muted-foreground/60">
            <Eye className="h-3.5 w-3.5" />
            <span className="text-[9px] font-medium uppercase tracking-wide">clic en deporte para ver</span>
          </div>
        )
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:h-[380px]">
        {!singleDeporte && (
          <>
            <div className="flex flex-col min-w-0 h-[260px] sm:h-auto sm:w-2/5">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 flex-none">
                Deportes en tu locación
              </p>
              <div ref={deportesChartRef} className="flex-1 min-h-0" />
            </div>
            <div className="hidden sm:block w-px bg-border shrink-0" />
          </>
        )}
        <div className="flex flex-col sm:flex-1 min-w-0 h-[260px] sm:h-auto">
          {provinciasLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : provinciasData ? (
            <>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5 flex-none">
                <span className="text-foreground font-semibold normal-case text-[11px]">{provinciasData.deporte.nombre}</span>
                {" · "}
                {provinciasData.totalProvincias} {provinciasData.totalProvincias === 1 ? "provincia" : "provincias"}
                {" · "}
                {provinciasData.totalDeportistas.toLocaleString("es-AR")} deportistas
              </p>
              <div ref={provinciasChartRef} className="flex-1 min-h-0" />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-center text-muted-foreground/50">
              <Globe className="h-9 w-9" />
              <p className="text-sm leading-5">Seleccioná un deporte<br />para ver su cobertura provincial</p>
            </div>
          )}
        </div>
      </div>
    </ChartCard>
  );
}

interface MunicipioRankingChartProps {
  data: MunicipiosTop10ContextoResponse | null;
}

export function MunicipioRankingChart({ data }: MunicipioRankingChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const top10 = useMemo(
    () => [...(data?.municipios ?? [])].sort((a, b) => a.posicion - b.posicion).slice(0, 10).reverse(),
    [data]
  );
  const municipioLogueadoId = data?.municipioLogueado?.id ?? null;

  const getDisplayName = (nombre: string, codigopostal: string | null) => {
    if (!codigopostal) return nombre;
    return `${nombre} (${codigopostal})`;
  };

  const isHighlightedMunicipio = (municipioId: number) => {
    if (!municipioLogueadoId) return true;
    return municipioId === municipioLogueadoId;
  };

  useEffect(() => {
    if (!chartRef.current || top10.length === 0) return;

    const chart = echarts.init(chartRef.current, "light");
    const labels = top10.map((d) => getDisplayName(d.nombre, d.codigopostal));
    const maleData = top10.map((d) => {
      const highlighted = isHighlightedMunicipio(d.id);
      return {
        value: d.totalHombres,
        itemStyle: { color: highlighted ? C_MALE : C_GRAY_MALE },
      };
    });
    const femaleData = top10.map((d) => {
      const highlighted = isHighlightedMunicipio(d.id);
      return {
        value: d.totalMujeres,
        itemStyle: {
          color: highlighted ? C_FEMALE : C_GRAY_FEMALE,
          borderRadius: [0, 8, 8, 0],
        },
      };
    });

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
        textStyle: { fontSize: 10, color: C_AXIS },
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
          const dataIndex = params[0]?.dataIndex;
          const item = typeof dataIndex === "number" ? top10[dataIndex] : undefined;
          if (!item) return "";

          const highlighted = isHighlightedMunicipio(item.id);
          const maleColor = highlighted ? C_MALE : C_GRAY_MALE;
          const femaleColor = highlighted ? C_FEMALE : C_GRAY_FEMALE;
          const total = item.totalHombres + item.totalMujeres;
          const displayName = getDisplayName(item.nombre, item.codigopostal);

          return `<span style="font-weight:700;color:#0f172a;font-size:13px;">#${item.posicion} ${displayName}</span><br/>
            <span style="color:${C_AXIS};font-size:11px;">Total de deportistas: </span>
            <span style="font-weight:900;color:#0f172a;font-size:14px;">${total.toLocaleString("es-AR")}</span><br/>
            <span style="color:${C_AXIS};font-size:11px;">En </span>
            <span style="font-weight:700;color:#0f172a;font-size:12px;">${item.totalClubs.toLocaleString("es-AR")}</span>
            <span style="color:${C_AXIS};font-size:11px;"> clubes</span><br/>
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${maleColor};margin-right:5px;"></span>
            <span style="color:${C_AXIS};font-size:11px;">Masculino: </span>
            <span style="font-weight:700;color:${maleColor};">${item.totalHombres.toLocaleString("es-AR")}</span><br/>
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${femaleColor};margin-right:5px;"></span>
            <span style="color:${C_AXIS};font-size:11px;">Femenino: </span>
            <span style="font-weight:700;color:${femaleColor};">${item.totalMujeres.toLocaleString("es-AR")}</span>`;
        },
      },
      grid: { left: 140, right: 32, top: 12, bottom: 52 },
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
        axisLabel: {
          fontFamily: "inherit",
          formatter: (value: string, index: number) => {
            const item = top10[index];
            if (!item) return value;
            const markToken = isHighlightedMunicipio(item.id) ? "markActive" : "markIdle";
            const nameToken = isHighlightedMunicipio(item.id) ? "name" : "nameMuted";
            return `{${markToken}|●} {pos|#${item.posicion}} {${nameToken}|${value}}`;
          },
          rich: {
            markActive: {
              color: C_BLUE_MAIN,
              fontWeight: 800,
              fontSize: 10,
            },
            markIdle: {
              color: "rgba(0, 0, 0, 0)",
              fontWeight: 800,
              fontSize: 10,
            },
            pos: {
              color: C_BLUE_MAIN,
              fontWeight: 700,
              fontSize: 11,
            },
            name: {
              color: "#0f172a",
              fontWeight: 600,
              fontSize: 11,
            },
            nameMuted: {
              color: "hsl(215, 10%, 52%)",
              fontWeight: 500,
              fontSize: 11,
            },
          },
        },
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
  }, [top10, municipioLogueadoId]);

  return (
    <ChartCard
      title="Top Municipios"
      subtitle="Por cantidad de deportistas y distribución por género"
      icon={<MapPin className="h-4 w-4 text-primary" />}
    >
      <div ref={chartRef} style={{ width: "100%", height: "360px" }} />
    </ChartCard>
  );
}

interface GenderBalanceByDeportChartProps {
  data: { sport: string; male: number; female: number }[];
}

export function GenderBalanceByDeportChart({ data }: GenderBalanceByDeportChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const chartData = data
      .map((item) => {
        const total = item.male + item.female;
        const pctF = total > 0 ? (item.female / total) * 100 : 50;
        const pctM = total > 0 ? (item.male / total) * 100 : 50;
        return {
          sport: item.sport,
          female: item.female,
          male: item.male,
          pctF: parseFloat(pctF.toFixed(1)),
          pctM: parseFloat(pctM.toFixed(1)),
        };
      })
      .sort((a, b) => b.pctF - a.pctF);

    const chart = echarts.init(chartRef.current, "light");
    const labels = chartData.map((d) => d.sport);
    const femaleData = chartData.map((d) => ({
      value: -d.pctF,
      sport: d.sport,
      count: d.female,
    }));
    const maleData = chartData.map((d) => ({
      value: d.pctM,
      sport: d.sport,
      count: d.male,
    }));

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
          if (!params || params.length === 0) return "";
          const name = params[0].name;
          const item = chartData.find((d) => d.sport === name);
          if (!item) return "";
          return `<span style="font-weight:700;font-size:13px;color:#0f172a;">${item.sport}</span><br/>
            <span style="color:${C_FEMALE};font-weight:600;">♀ ${item.pctF}%</span> (${item.female.toLocaleString("es-AR")}) <br/>
            <span style="color:${C_MALE};font-weight:600;">♂ ${item.pctM}%</span> (${item.male.toLocaleString("es-AR")})`;
        },
      },
      grid: { left: 120, right: 40, top: 16, bottom: 24 },
      xAxis: {
        type: "value",
        min: -100,
        max: 100,
        splitLine: { lineStyle: { color: "hsl(215, 20%, 85%)", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 10,
          color: C_AXIS,
          fontFamily: "inherit",
          formatter: (v: number) => (v === 0 ? "50/50" : `${Math.abs(v)}%`),
        },
      },
      yAxis: {
        type: "category",
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 11,
          color: "#0f172a",
          fontWeight: 500,
          fontFamily: "inherit",
        },
      },
      series: [
        {
          name: "Femenino",
          type: "bar",
          stack: "total",
          barMaxWidth: 18,
          data: femaleData,
          itemStyle: { color: C_FEMALE, borderRadius: [8, 0, 0, 8] },
          label: {
            show: true,
            position: "insideLeft",
            fontSize: 10,
            fontWeight: 600,
            color: "#ffffff",
            fontFamily: "inherit",
            formatter: (params: any) => {
              const val = Math.abs(params.value);
              return val > 5 ? `${val.toFixed(0)}%` : "";
            },
          },
          emphasis: { itemStyle: { opacity: 0.85 } },
          animationDuration: 900,
          animationDurationUpdate: 1100,
          animationDelay: (idx: number) => idx * 60,
          animationDelayUpdate: (idx: number) => idx * 60,
          animationEasing: "cubicOut",
          animationEasingUpdate: "cubicOut",
        },
        {
          name: "Masculino",
          type: "bar",
          stack: "total",
          barMaxWidth: 18,
          data: maleData,
          itemStyle: { color: C_MALE, borderRadius: [0, 8, 8, 0] },
          label: {
            show: true,
            position: "insideRight",
            fontSize: 10,
            fontWeight: 600,
            color: "#ffffff",
            fontFamily: "inherit",
            formatter: (params: any) => {
              const val = Math.abs(params.value);
              return val > 5 ? `${val.toFixed(0)}%` : "";
            },
          },
          emphasis: { itemStyle: { opacity: 0.85 } },
          animationDuration: 900,
          animationDurationUpdate: 1100,
          animationDelay: (idx: number) => idx * 60,
          animationDelayUpdate: (idx: number) => idx * 60,
          animationEasing: "cubicOut",
          animationEasingUpdate: "cubicOut",
        },
      ],
    }, true);

    const handleResize = () => chart.resize();
    const chartContainer = chartRef.current;
    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => chart.resize())
      : null;

    resizeObserver?.observe(chartContainer);
    window.addEventListener("resize", handleResize);

    const initialResizeFrame = window.requestAnimationFrame(() => {
      chart.resize();
    });

    return () => {
      resizeObserver?.disconnect();
      window.cancelAnimationFrame(initialResizeFrame);
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [data]);

  return (
    <div ref={chartRef} style={{ width: "100%", height: "340px" }} />
  );
}