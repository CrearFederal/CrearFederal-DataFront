import type { ReactNode } from "react";
import { useId, useMemo } from "react";
import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
} from "recharts";
import { TrendingDown, TrendingUp, MapPinHouse } from "lucide-react";
import type { EvaluacionesProvinciaTop10Item } from "../types/Evaluaciones";

const formatNumber = (value: number): string => value.toLocaleString("es-AR");
const USE_MOCK_DATA = false;

/** Ancho reservado por provincia: ~12 barras visibles en media card, el resto con scroll horizontal */
const BAR_SLOT_WIDTH = 56;

const shortenProvinceName = (nombre: string): string =>
    /ciudad aut/i.test(nombre) ? "CABA" : nombre;

export interface ProvinceComparisonChartProps {
    data?: EvaluacionesProvinciaTop10Item[];
    height?: number;
    className?: string;
    /** "all" = todas clickeables (coa); array de ids = solo esas (provincia); vacío/undefined = sin clicks */
    clickableProvinceIds?: number[] | "all";
    onProvinceClick?: (provincia: EvaluacionesProvinciaTop10Item) => void;
}

const MOCK_PROVINCIAS: EvaluacionesProvinciaTop10Item[] = [
    { id_provincia: 1, nombre: "Santa Fe", personasTotales: 4987, personasTotalesAnterior: 2493, actualVsAnterior: 50.1},
    { id_provincia: 2, nombre: "CABA", personasTotales: 4860, personasTotalesAnterior: 4510, actualVsAnterior: 7.8 },
    { id_provincia: 3, nombre: "Cordoba", personasTotales: 3710, personasTotalesAnterior: 3120, actualVsAnterior: 18.9 },
    { id_provincia: 4, nombre: "Mendoza", personasTotales: 3320, personasTotalesAnterior: 3490, actualVsAnterior: -4.9 },
    { id_provincia: 5, nombre: "Corrientes", personasTotales: 2890, personasTotalesAnterior: 2510, actualVsAnterior: 15.1 },
    { id_provincia: 1, nombre: "San Juan", personasTotales: 3000, personasTotalesAnterior: 1500, actualVsAnterior: 50 },
    { id_provincia: 2, nombre: "Buenos Aires", personasTotales: 4860, personasTotalesAnterior: 4510, actualVsAnterior: 7.8 },
    { id_provincia: 3, nombre: "Entre Ríos", personasTotales: 3710, personasTotalesAnterior: 3120, actualVsAnterior: 18.9 },
    { id_provincia: 4, nombre: "Misiones", personasTotales: 3320, personasTotalesAnterior: 3490, actualVsAnterior: -4.9 },
    { id_provincia: 5, nombre: "Formosa", personasTotales: 2890, personasTotalesAnterior: 2510, actualVsAnterior: 15.1 },
];

function ChartShell({
    title,
    subtitle,
    children,
    headerRight,
    className = "",
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
    headerRight?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`relative rounded-xl border border-border bg-card p-4 shadow-sm ${className}`}>
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <MapPinHouse className="h-4 w-4 text-primary" />
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

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const item = payload?.[0]?.payload as EvaluacionesProvinciaTop10Item | undefined;
    const curr = item?.personasTotales ?? 0;
    const prev = item?.personasTotalesAnterior ?? 0;
    const pct = item?.actualVsAnterior ?? (prev === 0 ? 0 : ((curr - prev) / Math.max(prev, 1)) * 100);
    const up = pct >= 0;
    return (
        <div className="min-w-[180px] rounded-xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-xl">
            <div className="text-sm font-semibold text-primary">
                {item?.nombre ?? label}
            </div>
            <div className="mt-1.5 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-2 w-2 rounded-sm bg-gradient-to-b from-primary/25 to-primary" />
                        Año actual
                    </span>
                    <span className="font-semibold text-foreground tabular-nums">
                        {formatNumber(curr)}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-[2px] w-3" style={{ backgroundImage: "repeating-linear-gradient(90deg,hsl(265 92% 64%) 0 3px,transparent 3px 6px)" }} />
                        Año anterior
                    </span>
                    <span className="font-medium text-muted-foreground tabular-nums">
                        {formatNumber(prev)}
                    </span>
                </div>
            </div>
            <div
                className={`mt-2 flex items-center gap-1 border-t border-border pt-2 text-xs ${up ? "text-green-600" : "text-red-600"
                    }`}
            >
                {up ? (
                    <TrendingUp className="h-3 w-3" />
                ) : (
                    <TrendingDown className="h-3 w-3" />
                )}
                <span className="tabular-nums font-semibold">
                    {up ? "+" : ""}
                    {new Intl.NumberFormat("es-AR", {
                        maximumFractionDigits: 1,
                    }).format(pct)}
                    % vs año anterior
                </span>
            </div>
        </div>
    );
}

export default function ProvinceComparisonChart({
    data = MOCK_PROVINCIAS,
    height = 340,
    className = "",
    clickableProvinceIds,
    onProvinceClick,
}: ProvinceComparisonChartProps) {
    const chartId = useId().replace(/:/g, "");
    const sourceData = USE_MOCK_DATA ? MOCK_PROVINCIAS : data;
    const top = useMemo(
        () => [...sourceData].sort((a, b) => b.personasTotales - a.personasTotales),
        [sourceData]
    );

    const isClickable = (item: EvaluacionesProvinciaTop10Item): boolean =>
        Boolean(onProvinceClick) &&
        (clickableProvinceIds === "all" || (clickableProvinceIds ?? []).includes(item.id_provincia));

    const currentGradientId = `mc-current-${chartId}`;
    const previousGradientId = `mc-previous-${chartId}`;
    const currentGlowId = `mc-current-glow-${chartId}`;
    const previousGlowId = `mc-previous-glow-${chartId}`;
    const hoverGlowId = `mc-hover-glow-${chartId}`;

    const renderXAxisTick = ({ x, y, payload }: any) => (
        <g transform={`translate(${x},${y})`}>
            <text
                dy={12}
                textAnchor="end"
                transform="rotate(-22)"
                fill="#111827"
                fontSize={10}
                fontWeight={400}
            >
                {shortenProvinceName(payload.value)}
            </text>
        </g>
    );

    const headerLegend = (
        <div className="pointer-events-none flex items-center gap-3 pt-0.5 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-gradient-to-b from-primary/25 to-primary shadow-[0_0_8px_rgba(37,99,235,0.32)]" />
                Año actual
            </span>
            <span className="flex items-center gap-1.5">
                <span
                    className="h-[2px] w-4"
                    style={{
                        backgroundImage: "repeating-linear-gradient(90deg,hsl(265 92% 64%) 0 4px,transparent 4px 8px)",
                        filter: "drop-shadow(0 0 4px rgba(147, 51, 234, 0.42))",
                    }}
                />
                Año anterior
            </span>
        </div>
    );

    if (top.length === 0) {
        return (
            <ChartShell
                title="Evaluados por provincia"
                subtitle="Todas las provincias por personas evaluadas y su comparación con el año anterior"
                headerRight={headerLegend}
                className={className}
            >
                <div
                    className="flex items-center justify-center rounded-xl border border-dashed border-border bg-background/50 px-4 text-center"
                    style={{ height }}
                >
                    <p className="text-sm text-muted-foreground">
                        Aún no hay datos de provincias para mostrar.
                    </p>
                </div>
            </ChartShell>
        );
    }

    return (
        <ChartShell
            title="Evaluados por provincia"
            subtitle="Todas las provincias por personas evaluadas y su comparación con el año anterior"
            headerRight={headerLegend}
            className={className}
        >
            <div className="overflow-x-auto overflow-y-hidden">
                <div style={{ height, minWidth: Math.max(top.length * BAR_SLOT_WIDTH, 480) }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={top}
                        margin={{ top: 26, right: 16, left: 0, bottom: 8 }}
                        barCategoryGap="28%"
                    >
                        <defs>
                            <linearGradient id={currentGradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.22} />
                                <stop offset="48%" stopColor="hsl(var(--primary))" stopOpacity={0.72} />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.98} />
                            </linearGradient>
                            <linearGradient id={previousGradientId} x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="hsl(265 92% 64%)" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="hsl(265 92% 64%)" stopOpacity={0.9} />
                            </linearGradient>
                            <filter id={currentGlowId} x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="2" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <filter id={previousGlowId} x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="2.5" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <filter id={hoverGlowId} x="-40%" y="-40%" width="180%" height="180%">
                                <feGaussianBlur stdDeviation="5" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        <CartesianGrid
                            stroke="currentColor"
                            strokeOpacity={0.07}
                            strokeDasharray="3 6"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="nombre"
                            tick={renderXAxisTick}
                            axisLine={false}
                            tickLine={false}
                            interval={0}
                            angle={-22}
                            textAnchor="end"
                            height={56}
                        />
                        <YAxis
                            tick={{ fill: "currentColor", fillOpacity: 0.48, fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            width={40}
                        />
                        <Tooltip
                            cursor={false}
                            content={<CustomTooltip />}
                        />

                        <Bar
                            dataKey="personasTotales"
                            radius={[8, 8, 4, 4]}
                            fill={`url(#${currentGradientId})`}
                            filter={`url(#${currentGlowId})`}
                            activeBar={{
                                fill: `url(#${currentGradientId})`,
                                stroke: "hsl(var(--primary))",
                                strokeWidth: 1.5,
                                filter: `url(#${hoverGlowId})`,
                                radius: 8,
                            }}
                            isAnimationActive
                            animationDuration={1650}
                            maxBarSize={42}
                        >
                            {top.map((item, i) => (
                                <Cell
                                    key={i}
                                    fill={`url(#${currentGradientId})`}
                                    cursor={isClickable(item) ? "pointer" : "default"}
                                    onClick={isClickable(item) ? () => onProvinceClick?.(item) : undefined}
                                />
                            ))}
                        </Bar>

                        <Line
                            type="monotone"
                            dataKey="personasTotalesAnterior"
                            stroke={`url(#${previousGradientId})`}
                            strokeWidth={2.25}
                            strokeDasharray="6 5"
                            filter={`url(#${previousGlowId})`}
                            isAnimationActive
                            animationDuration={1900}
                            dot={{
                                r: 3,
                                fill: "hsl(var(--card))",
                                stroke: "hsl(265 92% 64%)",
                                strokeWidth: 1.5,
                            }}
                            activeDot={{
                                r: 5,
                                fill: "hsl(var(--card))",
                                stroke: "hsl(265 92% 64%)",
                                strokeWidth: 2,
                            }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
                </div>
            </div>
        </ChartShell>
    );
}
