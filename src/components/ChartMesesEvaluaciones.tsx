import { useMemo, useState } from "react";
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceDot,
    ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, ChartColumnBig } from "lucide-react";
import type { EvaluacionesEvolucionMensualItem } from "../types/Evaluaciones";

const formatNumber = (value: number): string => value.toLocaleString("es-AR");

const USE_MOCK_DATA = true;

const MOCK_EJEMPLOS: EvaluacionesEvolucionMensualItem[] = [
    { mes: "Enero", cantidadEvaluados: 2480, actualVsAnterior: 8.2 },
    { mes: "Febrero", cantidadEvaluados: 2320, actualVsAnterior: -6.5 },
    { mes: "Marzo", cantidadEvaluados: 2760, actualVsAnterior: 19.0 },
    { mes: "Abril", cantidadEvaluados: 3140, actualVsAnterior: 13.8 },
    { mes: "Mayo", cantidadEvaluados: 2870, actualVsAnterior: -8.6 },
    { mes: "Junio", cantidadEvaluados: 2430, actualVsAnterior: -15.3 },

    // mínimo
    { mes: "Julio", cantidadEvaluados: 1980, actualVsAnterior: -18.5 },

    { mes: "Agosto", cantidadEvaluados: 2380, actualVsAnterior: 20.2 },
    { mes: "Septiembre", cantidadEvaluados: 2960, actualVsAnterior: 24.4 },
    { mes: "Octubre", cantidadEvaluados: 3510, actualVsAnterior: 18.6 },

    // máximo
    { mes: "Noviembre", cantidadEvaluados   : 4170, actualVsAnterior: 18.8 },

    { mes: "Diciembre", cantidadEvaluados: 3720, actualVsAnterior: -10.8 },
];

export interface MonthlyEvaluationsChartProps {
    data?: EvaluacionesEvolucionMensualItem[];
    height?: number;
    className?: string;
    title?: string;
    subtitle?: string;
}

function ChartShell({
    title,
    subtitle,
    headerRight,
    children,
    className = "",
}: {
    title: string;
    subtitle?: string;
    headerRight?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`relative rounded-xl border border-border bg-card p-4 shadow-sm ${className}`}>
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <ChartColumnBig className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                    </div>
                    {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
                </div>
                {headerRight}
            </div>
            {children}
        </div>
    );
}

function CustomTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload as EvaluacionesEvolucionMensualItem;
    const Icon = p.actualVsAnterior === 0 ? Minus : p.actualVsAnterior > 0 ? TrendingUp : TrendingDown;
    const tone =
        p.actualVsAnterior === 0
            ? "text-zinc-400"
            : p.actualVsAnterior > 0
                ? "text-green-600 font-semibold"
                : "text-red-600 font-semibold";
    return (
        <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.28 }}
            className="rounded-xl border border-border bg-white px-3.5 py-2.5 shadow-2xl"
        >
            <div className="text-sm uppercase tracking-wider font-bold text-primary">
                {p.mes}
            </div>
            <div className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
                {new Intl.NumberFormat("es-AR", {
                        maximumFractionDigits: 1,
                    }).format(p.cantidadEvaluados)} <span className="text-xs text-muted-foreground">Evaluados</span>
            </div>
            <div className={`mt-2 flex items-center gap-1 text-xs border-t border-border pt-2 ${tone}`}>
                <Icon className="h-3 w-3" />
                <span className="tabular-nums">
                    {p.actualVsAnterior >= 0 ? "+" : ""}
                    {new Intl.NumberFormat("es-AR", {
                        maximumFractionDigits: 1,
                    }).format(p.actualVsAnterior)}
                    % vs mes anterior
                </span>
            </div>
        </motion.div>
    );
}

export default function MonthlyEvaluationsChart({
    data = [],
    height = 320,
    className = "",
    title = "Evolución mensual",
    subtitle = "Cantidad de evaluados por mes y comparación con el mes anterior",
}: MonthlyEvaluationsChartProps) {
    const [hovered, setHovered] = useState<number | null>(null);
    const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
    const [hoveredX, setHoveredX] = useState<number | null>(null);

    const chartData = useMemo(
        () => [...(USE_MOCK_DATA ? MOCK_EJEMPLOS : data)],
        [data]
    );

    const { maxPoint, minPoint } = useMemo(() => {
        if (!chartData.length) return { maxPoint: null, minPoint: null };
        let max = chartData[0], min = chartData[0];
        for (const d of chartData) {
            if (d.cantidadEvaluados > max.cantidadEvaluados) max = d;
            if (d.cantidadEvaluados < min.cantidadEvaluados) min = d;
        }
        return { maxPoint: max, minPoint: min };
    }, [chartData]);

    const maxIndex = maxPoint ? chartData.findIndex((point) => point.mes === maxPoint.mes) : -1;
    const minIndex = minPoint ? chartData.findIndex((point) => point.mes === minPoint.mes) : -1;

    const getHoverPointColors = (index: number): { fill: string; stroke: string } => {
        if (index === minIndex) {
            return { fill: "#fb7185", stroke: "#881337" };
        }

        if (index === maxIndex) {
            return { fill: "#34d399", stroke: "#064e3b" };
        }

        return { fill: "#3b82f6", stroke: "#1d4ed8" };
    };

    const shortMonth = (value: any) => {
        const s = String(value ?? "");
        const part = s.slice(0, 3);
        return part.charAt(0).toUpperCase() + part.slice(1).toUpperCase();
    };

    const headerLegend = (
        <div className="pointer-events-none flex items-center gap-3 pt-0.5 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-green-600 shadow-[0_0_8px_rgba(52,211,153,0.35)]" />
                Máximo
            </span>
            <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-red-600 shadow-[0_0_8px_rgba(251,113,133,0.35)]" />
                Mínimo
            </span>
        </div>
    );

    if (!chartData.length) {
        return (
            <ChartShell title={title} subtitle={subtitle} headerRight={headerLegend} className={className}>
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex w-full items-center justify-center rounded-xl border border-dashed border-border bg-background/50 px-4 text-center"
                    style={{ height }}
                >
                    <p className="text-sm text-muted-foreground">Aún no hay datos mensuales para mostrar.</p>
                </motion.div>
            </ChartShell>
        );
    }

    return (
        <ChartShell title={title} subtitle={subtitle} headerRight={headerLegend} className={className}>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative w-full"
                style={{ height }}
            >
                {hoveredX !== null && hoveredMonth && (
                    <div
                        className="pointer-events-none absolute top-0 z-20 h-full border-l-2 border-dashed border-primary/90"
                        style={{ left: hoveredX }}
                    />
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 24, right: 16, left: 0, bottom: 8 }}
                        onMouseMove={(s: any) => {
                            const activeIndex = typeof s?.activeTooltipIndex === "number" ? s.activeTooltipIndex : null;
                            const activeX = typeof s?.activeCoordinate?.x === "number" ? s.activeCoordinate.x : null;
                            setHovered(activeIndex);
                            setHoveredMonth(activeIndex !== null ? chartData[activeIndex]?.mes ?? null : null);
                            setHoveredX(activeIndex !== null ? activeX : null);
                        }
                        }
                        onMouseLeave={() => {
                            setHovered(null);
                            setHoveredMonth(null);
                            setHoveredX(null);
                        }}
                    >
                        <defs>
                            <linearGradient id="meAreaFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.55} />
                                <stop offset="55%" stopColor="#6366f1" stopOpacity={0.18} />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="meStroke" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#22d3ee" />
                                <stop offset="50%" stopColor="#818cf8" />
                                <stop offset="100%" stopColor="#e879f9" />
                            </linearGradient>
                            <filter id="meGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3.5" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        <CartesianGrid
                            stroke="currentColor"
                            strokeOpacity={0.06}
                            strokeDasharray="3 6"
                            vertical={false}
                        />  
                        <XAxis
                            dataKey="mes"
                            tick={{ fill: "currentColor", fontSize: 12, fontWeight: 400 }}
                            tickFormatter={shortMonth}
                            axisLine={false}
                            tickLine={false}
                            dy={6}
                        />
                        <YAxis
                            tick={{ fill: "currentColor", fillOpacity: 0.45, fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            width={40}
                        />
                        <Tooltip
                            cursor={{
                                stroke: "hsl(var(--primary))",
                                strokeWidth: 1,
                                strokeDasharray: "3 5",
                                strokeOpacity: 0.7,
                                fill: "transparent",
                            }}
                            content={<CustomTooltip />}
                        />

                        <Area
                            type="monotone"
                            dataKey="cantidadEvaluados"
                            stroke="none"
                            fill="url(#meAreaFill)"
                            isAnimationActive
                            animationDuration={1650}
                        />
                        <Area
                            type="monotone"
                            dataKey="cantidadEvaluados"
                            stroke="url(#meStroke)"
                            strokeWidth={2.5}
                            fill="transparent"
                            filter="url(#meGlow)"
                            isAnimationActive
                            animationDuration={2100}
                            activeDot={(props: any) => {
                                const { cx, cy, index } = props;
                                const colors = getHoverPointColors(index);

                                return (
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={6}
                                        fill={colors.fill}
                                        stroke={colors.stroke}
                                        strokeWidth={2}
                                        style={{ transition: "all 180ms ease" }}
                                    />
                                );
                            }}
                            dot={(props: any) => {
                                const { cx, cy, index } = props;
                                const isHover = hovered === index;
                                return (
                                    <circle
                                        key={index}
                                        cx={cx}
                                        cy={cy}
                                        r={isHover ? 4 : 2.5}
                                        fill="primary"
                                        stroke="primary"
                                        strokeWidth={1.5}
                                        style={{ transition: "r 200ms ease" }}
                                    />
                                );
                            }}
                        />

                        {maxPoint && (
                            <>
                                <ReferenceLine
                                    x={maxPoint.mes}
                                    stroke="#34d399"
                                    strokeWidth={1.5}
                                    strokeDasharray="4 4"
                                    ifOverflow="extendDomain"
                                />
                                <ReferenceDot
                                    x={maxPoint.mes}
                                    y={maxPoint.cantidadEvaluados}
                                    r={7}
                                    fill="#34d399"
                                    stroke="#064e3b"
                                    strokeWidth={3}
                                    ifOverflow="extendDomain"
                                />
                            </>
                        )}
                        {minPoint && (
                            <>
                                <ReferenceLine
                                    x={minPoint.mes}
                                    stroke="#fb7185"
                                    strokeWidth={1.5}
                                    strokeDasharray="4 4"
                                    ifOverflow="extendDomain"
                                />
                                <ReferenceDot
                                    x={minPoint.mes}
                                    y={minPoint.cantidadEvaluados}
                                    r={7}
                                    fill="#fb7185"
                                    stroke="#881337"
                                    strokeWidth={3}
                                    ifOverflow="extendDomain"
                                />
                            </>
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </motion.div>
        </ChartShell>
    );
}
