import { useId, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { TicketCheck, CircleFadingArrowUp} from "lucide-react";
import { Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { EvaluacionesPorNivelItem } from "../types/Evaluaciones";

type ChartItem = EvaluacionesPorNivelItem & { fill: string };

const LEVEL_COLORS: Record<string, string> = {
    Escolar: "#3b82f6",
    Base: "#069c2c",
    Intermedio: "#f59e0b",
    Avanzado: "#8b5cf6",
};

const FALLBACK_COLORS = ["#3b82f6", "#069c2c", "#f59e0b", "#8b5cf6", "#ec4899"];

function ChartShell({
    title,
    subtitle,
    children,
    className = "",
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`relative rounded-xl border border-border bg-card p-4 shadow-sm ${className}`}>
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <CircleFadingArrowUp className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                    </div>
                    {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}

function CustomTooltip({ active, payload, total }: any) {
    if (!active || !payload?.length) return null;

    const item = payload[0].payload as ChartItem;
    const percentage = item.porcentaje ?? (total ? (item.cantidad / total) * 100 : 0);

    return (
        <div className="min-w-[180px] rounded-xl border border-border bg-white p-3 shadow-2xl">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
                <TicketCheck className="h-3.5 w-3.5" style={{ color: item.fill }} />
                {item.nivel_evaluado}
            </div>
            <div className="mt-1 text-lg font-bold tabular-nums" style={{ color: item.fill }}>
                {item.cantidad.toLocaleString("es-AR")}
            </div>
            <div className="mt-1 justify-center text-xs font-medium flex border-t border-border tracking-wide text-muted-foreground">
                <div className="flex items-center gap-1 mt-1">
                    <span>Representa el {" "}</span>
                    <div className="text-base font-semibold tabular-nums" style={{ color: item.fill }}>
                        {Math.round(percentage)}%
                    </div>
                </div>
            </div>
        </div>
    );
}

export interface ChartCakeNivelesProps {
    data?: EvaluacionesPorNivelItem[];
    height?: number;
    className?: string;
    title?: string;
    subtitle?: string;
}

export default function ChartCakeNiveles({
    data = [],
    height = 320,
    className = "",
    title = "Niveles evaluados",
    subtitle = "Distribución de evaluados en cada nivel",
}: ChartCakeNivelesProps) {
    const chartId = useId().replace(/:/g, "");
    const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
    const [hoveredLevel, setHoveredLevel] = useState<string | null>(null);

    const chartData = useMemo<ChartItem[]>(() => {
        return data.map((item, index) => ({
            ...item,
            fill: LEVEL_COLORS[item.nivel_evaluado] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length],
        }));
    }, [data]);

    const total = useMemo(() => chartData.reduce((sum, item) => sum + item.cantidad, 0), [chartData]);
    const selectedItem = useMemo(
        () => chartData.find((item) => item.nivel_evaluado === selectedLevel) ?? null,
        [chartData, selectedLevel]
    );
    const centerValue = selectedItem?.cantidad ?? total;

    if (!chartData.length) {
        return (
            <ChartShell title={title} subtitle={subtitle} className={className}>
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex w-full items-center justify-center rounded-xl border border-dashed border-border bg-background/50 px-4 text-center"
                    style={{ height }}
                >
                    <p className="text-sm text-muted-foreground">Aún no hay datos de niveles para mostrar.</p>
                </motion.div>
            </ChartShell>
        );
    }

    return (
        <ChartShell title={title} subtitle={subtitle} className={className}>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full flex flex-col gap-2 overflow-hidden"
                style={{ height }}
            >
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-xs text-muted-foreground overflow-x-auto overflow-y-hidden flex-shrink-0">
                    <span className="font-medium text-foreground whitespace-nowrap flex-shrink-0 hidden md:inline-block">Seleccionar nivel:</span>
                    <div className="flex items-center gap-1.5 flex-nowrap">
                        {chartData.map((item) => {
                            const checked = selectedLevel === item.nivel_evaluado;

                            return (
                                <button
                                    key={item.nivel_evaluado}
                                    type="button"
                                    onClick={() => setSelectedLevel(checked ? null : item.nivel_evaluado)}
                                    className={`flex items-center gap-1 rounded-lg border px-1.5 py-0.5 transition-all whitespace-nowrap flex-shrink-0 text-xs ${
                                        checked
                                            ? "text-foreground shadow-sm"
                                            : "border-border/70 bg-background/70 hover:bg-muted/40"
                                    }`}
                                    style={
                                        checked
                                            ? {
                                                  borderColor: item.fill,
                                                  backgroundColor: `${item.fill}14`,
                                                  boxShadow: `0 0 0 1px ${item.fill}40 inset`,
                                              }
                                            : undefined
                                    }
                                >
                                    <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.fill }} />
                                    <span
                                        className={checked ? "font-semibold" : ""}
                                        style={checked ? { color: item.fill } : undefined}
                                    >
                                        {item.nivel_evaluado}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 min-h-0 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <defs>
                            <linearGradient id={`pie-center-${chartId}`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.95} />
                                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.85} />
                            </linearGradient>
                        </defs>
                        <Tooltip content={<CustomTooltip total={total} />} />
                        <Pie
                            data={chartData}
                            dataKey="cantidad"
                            nameKey="nivel_evaluado"
                            innerRadius={90}
                            outerRadius={150}
                            paddingAngle={2}
                            cornerRadius={8}
                            stroke="hsl(var(--background))"
                            strokeWidth={1.5}
                        >
                            {chartData.map((entry) => {
                                const isSelected = !selectedLevel || selectedLevel === entry.nivel_evaluado;
                                const isHovered = hoveredLevel === entry.nivel_evaluado;
                                const isDimmed = Boolean((selectedLevel && !isSelected) || (hoveredLevel && !isHovered));

                                return (
                                    <Cell
                                        key={entry.nivel_evaluado}
                                        fill={entry.fill}
                                        opacity={isDimmed ? 0.24 : 1}
                                        stroke={
                                            (selectedLevel && isSelected) || isHovered
                                                ? entry.fill
                                                : "hsl(var(--background))"
                                        }
                                        strokeWidth={isHovered ? 5 : selectedLevel && isSelected ? 4 : 1.5}
                                        onMouseEnter={() => setHoveredLevel(entry.nivel_evaluado)}
                                        onMouseLeave={() => setHoveredLevel(null)}
                                        style={{
                                            cursor: "pointer",
                                            filter:
                                                (selectedLevel && isSelected) || isHovered
                                                    ? `drop-shadow(0 0 10px ${entry.fill}66)`
                                                    : undefined,
                                        }}
                                    />
                                );
                            })}
                            <Label
                                content={(props: any) => {
                                    const viewBox = props?.viewBox as { cx?: number; cy?: number } | undefined;
                                    if (!viewBox?.cx || !viewBox?.cy) return null;

                                    return (
                                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                            <tspan x={viewBox.cx} y={viewBox.cy - 4} className="fill-foreground text-3xl font-bold">
                                                {centerValue.toLocaleString("es-AR")}
                                            </tspan>
                                            <tspan x={viewBox.cx} y={viewBox.cy + 18} className="fill-muted-foreground text-xs">
                                                {selectedItem ? selectedItem.nivel_evaluado : "Evaluaciones"}
                                            </tspan>
                                        </text>
                                    );
                                }}
                            />
                        </Pie>
                    </PieChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </ChartShell>
    );
}