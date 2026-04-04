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
import type { ReactNode } from "react";

// ---------------- CONSTANTS ----------------

const BAR_COLORS = [
  "hsl(215, 100%, 45%)",
  "hsl(215, 95%, 50%)",
  "hsl(215, 90%, 48%)",
  "hsl(215, 100%, 46%)",
  "hsl(215, 100%, 44%)",
];

const GENDER_COLORS = {
  male: "hsl(215, 100%, 45%)",
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

// Custom Modern Tooltip
function ModernTooltip(props: any) {
  const { active, payload } = props;
  if (!active || !payload?.length) return null;
  
  const data = payload[0].payload;
  const label = data.sport || data.range || "N/A";
  
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-blue-200 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-blue-900">{label}</p>
      <p className="text-sm font-bold text-blue-600">{payload[0].value} ({data.sport ? 'atletas' : 'count'})</p>
    </div>
  );
}

// 3D Bar Component for visual depth
function Bar3D(props: any) {
  const { x, y, width, height, fill } = props;
  const depth = 8;
  
  return (
    <g>
      {/* 3D Back face */}
      <rect
        x={x + depth}
        y={y - depth}
        width={width}
        height={height}
        fill={fill}
        opacity="0.3"
      />
      {/* 3D Top face */}
      <polygon
        points={`${x},${y} ${x + depth},${y - depth} ${x + width + depth},${y - depth} ${x + width},${y}`}
        fill={fill}
        opacity="0.5"
      />
      {/* 3D Right face */}
      <polygon
        points={`${x + width},${y} ${x + width + depth},${y - depth} ${x + width + depth},${y - depth + height} ${x + width},${y + height}`}
        fill={fill}
        opacity="0.4"
      />
      {/* Main front face */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        rx="6"
      />
    </g>
  );
}

// ---------------- ATHLETES PER SPORT - 3D MODERN ----------------

interface AthletesPerSportChartProps {
  data: { sport: string; count: number }[];
}

export function AthletesPerSportChart({
  data,
}: AthletesPerSportChartProps) {
  return (
    <ChartCard title="Atletas por Deporte">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ left: 10, right: 10, top: 20, bottom: 60 }}
        >
          <XAxis
            dataKey="sport"
            tick={{ fontSize: 11, fill: "hsl(215, 30%, 40%)", fontWeight: 500 }}
            axisLine={{ stroke: "hsl(215, 30%, 88%)" }}
            tickLine={false}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(215, 30%, 60%)" }}
            axisLine={{ stroke: "hsl(215, 30%, 88%)" }}
            tickLine={false}
          />
          <Tooltip content={<ModernTooltip />} cursor={{ fill: "rgba(59, 130, 246, 0.1)" }} />

          <Bar
            dataKey="count"
            shape={<Bar3D />}
            isAnimationActive={true}
            animationDuration={800}
            radius={[6, 6, 0, 0]}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={BAR_COLORS[i % BAR_COLORS.length]}
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
          <Tooltip content={<ModernTooltip />} cursor={{ fill: "rgba(59, 130, 246, 0.1)" }} />

          <Bar
            dataKey="count"
            fill={BAR_COLORS[0]}
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}