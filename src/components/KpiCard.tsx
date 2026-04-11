import { useMemo } from "react";
import type { ReactNode } from "react";

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  subtitle?: string;
}

function formatValue(value: number | string): string {
  if (typeof value === "number") return value.toLocaleString("es-AR");
  return value;
}

function KpiCard({ title, value, icon, subtitle }: KpiCardProps) {
  const formattedValue = useMemo(() => formatValue(value), [value]);

  return (
    <div className="kpi-card fade-up group">
      {/* Accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-primary/60 transition-all duration-300 group-hover:bg-primary" />

      <div className="flex items-start justify-between gap-2 pl-2">
        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {title}
          </p>
          <p
            className="mt-1.5 font-mono font-bold text-foreground leading-none truncate"
            style={{ fontSize: "clamp(15px, 1.8vw, 22px)" }}
          >
            {formattedValue}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>

        {/* Icon */}
        <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0 transition-colors group-hover:bg-primary/15">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default KpiCard;
