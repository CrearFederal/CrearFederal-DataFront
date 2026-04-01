import { useMemo } from "react";
import type { ReactNode } from "react";

// ---------------- TYPES ----------------

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  subtitle?: string;
}

// ---------------- HELPERS ----------------

function formatValue(value: number | string): string {
  if (typeof value === "number") {
    return value.toLocaleString();
  }
  return value;
}

// ---------------- COMPONENT ----------------

function KpiCard({
  title,
  value,
  icon,
  subtitle,
}: KpiCardProps) {
  const formattedValue = useMemo(
    () => formatValue(value),
    [value]
  );

  return (
    <div className="kpi-card fade-up">
      <div className="flex items-start justify-between">
        {/* TEXT */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>

          <p
            className="mt-2 font-mono font-bold text-foreground"
            style={{
              fontSize: "clamp(16px, 2vw, 24px)",
            }}
          >
            {formattedValue}
          </p>

          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {/* ICON */}
        <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default KpiCard;