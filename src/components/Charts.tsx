import{
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { ReactNode } from "react";

// ---------------- CONSTANTS ----------------

const BAR_COLOR = "#1a56db";

const GENDER_COLORS = {
  male: "hsl(215, 70%, 50%)",
  female: "hsl(340, 65%, 55%)",
};

// ---------------- SHARED COMPONENT ----------------

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ---------------- TOOLTIP ----------------

const tooltipStyle: TooltipProps<any, any> = {
  contentStyle: {
    background: "hsl(220, 18%, 13%)",
    border: "1px solid hsl(220, 15%, 20%)",
    borderRadius: "8px",
    fontSize: "12px",
    color: "hsl(210, 20%, 92%)",
  },
};

// ---------------- ATHLETES PER SPORT ----------------

interface AthletesPerSportChartProps {
  data: { sport: string; count: number }[];
}

export function AthletesPerSportChart({
  data,
}: AthletesPerSportChartProps) {
  return (
    <ChartCard title="Atletas por Deporte">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 10 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "hsl(215, 15%, 55%)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="sport"
            width={80}
            tick={{ fontSize: 11, fill: "hsl(210, 20%, 85%)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip {...tooltipStyle} />

          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={BAR_COLOR}
                fillOpacity={0.65 + (i % 3) * 0.12}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ---------------- GENDER ----------------

interface GenderDistributionChartProps {
  data: {
    male: number;
    female: number;
    malePercent: number;
    femalePercent: number;
  };
}

export function GenderDistributionChart({
  data,
}: GenderDistributionChartProps) {
  const pieData = [
    { name: "Masculino", value: data.male },
    { name: "Femenino", value: data.female },
  ];

  return (
    <ChartCard title="Distribución por Género">
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={100} height={100}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={28}
              outerRadius={45}
              strokeWidth={0}
            >
              <Cell fill={GENDER_COLORS.male} />
              <Cell fill={GENDER_COLORS.female} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <div className="flex-1 space-y-2">
          <GenderRow
            label="Masculino"
            color={GENDER_COLORS.male}
            value={data.malePercent}
          />
          <GenderRow
            label="Femenino"
            color={GENDER_COLORS.female}
            value={data.femalePercent}
          />
        </div>
      </div>
    </ChartCard>
  );
}

// ---------------- GENDER ROW ----------------

interface GenderRowProps {
  label: string;
  color: string;
  value: number;
}

function GenderRow({ label, color, value }: GenderRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: color }}
        />
        <span className="text-xs text-muted-foreground">
          {label}
        </span>
      </div>

      <span className="font-mono text-sm font-semibold text-foreground">
        {value}%
      </span>
    </div>
  );
}

// ---------------- AGE ----------------

interface AgeDistributionChartProps {
  data: { range: string; count: number }[];
}

export function AgeDistributionChart({
  data,
}: AgeDistributionChartProps) {
  return (
    <ChartCard title="Distribución por Edad">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ left: -10, right: 10 }}>
          <XAxis
            dataKey="range"
            tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip {...tooltipStyle} />

          <Bar
            dataKey="count"
            fill={BAR_COLOR}
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}