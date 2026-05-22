import { useMemo } from "react";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  subtitle?: ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

function formatValue(value: number | string): string {
  if (typeof value === "number") return value.toLocaleString("es-AR");
  return value;
}

function KpiCard({ title, value, icon, subtitle, onClick }: KpiCardProps) {
  const formattedValue = useMemo(() => formatValue(value), [value]);

  const cardClasses = `kpi-card fade-up group ${onClick ? "cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0" : ""}`;

  const content = (
    <>
      {/* Accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-primary/60 transition-all duration-300 group-hover:bg-primary" />

      <div className="flex items-start justify-between gap-2 pl-2 text-left w-full">
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
            <div className="mt-1 text-xs text-muted-foreground truncate">{subtitle}</div>
          )}
        </div>

        {/* Icon + click hint */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="rounded-lg bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary/15">
            {icon}
          </div>
          {onClick && (
            <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
          )}
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cardClasses}>
        {content}
      </button>
    );
  }

  return <div className={cardClasses}>{content}</div>;
}

export default KpiCard;
