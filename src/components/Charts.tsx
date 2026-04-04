import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  LabelList,
} from "recharts";

// ---------------- DESIGN TOKENS ----------------

const C_BLUE_MAIN   = "hsl(215, 85%, 52%)";
const C_BLUE_LIGHT  = "hsl(218, 80%, 68%)";
const C_FEMALE      = "hsl(330, 65%, 58%)";
const C_MALE        = "hsl(215, 85%, 52%)";
const C_GRID        = "hsl(215, 30%, 92%)";
const C_AXIS        = "hsl(215, 20%, 60%)";

const SPORT_COLORS = [
  "hsl(215, 85%, 52%)",
  "hsl(220, 80%, 56%)",
  "hsl(225, 75%, 60%)",
  "hsl(230, 70%, 63%)",
  "hsl(210, 85%, 55%)",
  "hsl(205, 80%, 56%)",
  "hsl(215, 75%, 58%)",
  "hsl(218, 82%, 54%)",
];

// ---------------- SHARED ----------------

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

function ChartCard({ title, subtitle, children, className = "" }: ChartCardProps) {
  return (
    <div className={`rounded-xl border border-border bg-card p-4 flex flex-col ${className}`}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-border rounded-xl px-3.5 py-2.5 shadow-lg">
      {label && (
        <p className="text-xs font-semibold text-foreground mb-1.5">{label}</p>
      )}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full shrink-0"
            style={{ background: p.color || p.fill }}
          />
          <p className="text-xs text-muted-foreground">
            {p.name ? `${p.name}: ` : ""}
            <span className="font-bold text-foreground">
              {p.value?.toLocaleString("es-AR")}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}

// ---------------- ATHLETES PER SPORT — horizontal bar ----------------

interface AthletesPerSportChartProps {
  data: { sport: string; count: number }[];
}

export function AthletesPerSportChart({ data }: AthletesPerSportChartProps) {
  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 8);
  const max = sorted[0]?.count || 1;

  return (
    <ChartCard
      title="Atletas por Deporte"
      subtitle="Distribución según disciplina registrada"
      className="flex-1"
    >
      <div className="flex-1" style={{ minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ left: 4, right: 36, top: 2, bottom: 2 }}
            barCategoryGap="30%"
          >
            <defs>
              <linearGradient id="barSport" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={C_BLUE_MAIN} />
                <stop offset="100%" stopColor={C_BLUE_LIGHT} />
              </linearGradient>
            </defs>

            <XAxis type="number" hide domain={[0, max * 1.12]} />
            <YAxis
              type="category"
              dataKey="sport"
              width={72}
              tick={{ fontSize: 11, fill: C_AXIS, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(215, 50%, 97%)" }} />

            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              maxBarSize={16}
            >
              <LabelList
                dataKey="count"
                position="right"
                style={{ fontSize: 10, fill: C_AXIS, fontWeight: 600 }}
                formatter={(v: any) => v?.toLocaleString("es-AR")}
              />
              {sorted.map((_, i) => (
                <Cell key={i} fill={SPORT_COLORS[i % SPORT_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

// ---------------- GENDER DISTRIBUTION — donut + bars ----------------

interface GenderDistributionChartProps {
  data: {
    male: number;
    female: number;
    malePercent: number;
    femalePercent: number;
  };
}

export function GenderDistributionChart({ data }: GenderDistributionChartProps) {
  const pieData = [
    { name: "Masculino", value: data.male },
    { name: "Femenino", value: data.female },
  ];

  return (
    <ChartCard title="Distribución por Género" subtitle="Total de deportistas activos">
      <div className="flex items-center gap-5">
        {/* Donut */}
        <div className="shrink-0">
          <ResponsiveContainer width={110} height={110}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={50}
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
                paddingAngle={3}
              >
                <Cell fill={C_MALE} />
                <Cell fill={C_FEMALE} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          {[
            { label: "Masculino", color: C_MALE, pct: data.malePercent, count: data.male },
            { label: "Femenino",  color: C_FEMALE, pct: data.femalePercent, count: data.female },
          ].map((g) => (
            <div key={g.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: g.color }} />
                  <span className="text-xs text-muted-foreground">{g.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {g.count.toLocaleString("es-AR")}
                  </span>
                  <span
                    className="text-sm font-bold font-mono"
                    style={{ color: g.color }}
                  >
                    {g.pct}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${g.pct}%`, background: g.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

// ---------------- AGE DISTRIBUTION — area ----------------

interface AgeDistributionChartProps {
  data: { range: string; count: number }[];
}

export function AgeDistributionChart({ data }: AgeDistributionChartProps) {
  return (
    <ChartCard title="Distribución por Edad" subtitle="Pirámide etaria de deportistas">
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ left: -8, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="ageGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={C_BLUE_MAIN} stopOpacity={0.35} />
              <stop offset="95%" stopColor={C_BLUE_MAIN} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={C_GRID}
            vertical={false}
          />
          <XAxis
            dataKey="range"
            tick={{ fontSize: 10, fill: C_AXIS }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: C_AXIS }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: C_BLUE_MAIN, strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Area
            type="monotone"
            dataKey="count"
            name="Deportistas"
            stroke={C_BLUE_MAIN}
            strokeWidth={2.5}
            fill="url(#ageGrad)"
            dot={{ r: 3, fill: C_BLUE_MAIN, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: C_BLUE_MAIN, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ---------------- PROVINCE RANKING — horizontal bar ----------------

interface ProvinceRankingChartProps {
  data: { nombre: string; totalAthletes: number; totalClubs: number }[];
}

export function ProvinceRankingChart({ data }: ProvinceRankingChartProps) {
  const top8 = [...data]
    .sort((a, b) => b.totalAthletes - a.totalAthletes)
    .slice(0, 8);
  const max = top8[0]?.totalAthletes || 1;

  return (
    <ChartCard title="Top Provincias" subtitle="Por cantidad de atletas registrados">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={top8}
          layout="vertical"
          margin={{ left: 4, right: 36, top: 2, bottom: 2 }}
          barCategoryGap="28%"
        >
          <defs>
            <linearGradient id="barProv" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(215, 85%, 50%)" />
              <stop offset="100%" stopColor="hsl(200, 80%, 65%)" />
            </linearGradient>
          </defs>
          <XAxis type="number" hide domain={[0, max * 1.12]} />
          <YAxis
            type="category"
            dataKey="nombre"
            width={80}
            tick={{ fontSize: 10, fill: C_AXIS, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(215, 50%, 97%)" }} />
          <Bar dataKey="totalAthletes" name="Atletas" fill="url(#barProv)" radius={[0, 6, 6, 0]} maxBarSize={14}>
            <LabelList
              dataKey="totalAthletes"
              position="right"
              style={{ fontSize: 10, fill: C_AXIS, fontWeight: 600 }}
              formatter={(v: any) => v?.toLocaleString("es-AR")}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ---------------- GENDER PER SPORT — stacked horizontal ----------------

interface GenderPerSportChartProps {
  data: { sport: string; male: number; female: number }[];
}

export function GenderPerSportChart({ data }: GenderPerSportChartProps) {
  const sorted = [...data].sort((a, b) => (b.male + b.female) - (a.male + a.female));

  return (
    <ChartCard title="Género por Deporte" subtitle="Distribución masculino / femenino">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ left: 4, right: 8, top: 2, bottom: 2 }}
          barCategoryGap="28%"
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="sport"
            width={72}
            tick={{ fontSize: 11, fill: C_AXIS, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(215, 50%, 97%)" }} />
          <Bar dataKey="male"   name="Masculino" stackId="a" fill={C_MALE}   radius={[0, 0, 0, 0]} maxBarSize={14} />
          <Bar dataKey="female" name="Femenino"  stackId="a" fill={C_FEMALE} radius={[0, 6, 6, 0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
