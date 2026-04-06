import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { LineChart } from "@mui/x-charts/LineChart";

// ---------------- DESIGN TOKENS ----------------

const C_BLUE_MAIN  = "hsl(215, 85%, 52%)";
const C_BLUE_LIGHT = "hsl(218, 80%, 68%)";
const C_FEMALE     = "hsl(330, 65%, 58%)";
const C_MALE       = "hsl(215, 85%, 52%)";
const C_AXIS       = "hsl(215, 20%, 55%)";

const SPORT_COLORS = [
  "hsl(215, 85%, 52%)",
  "hsl(220, 78%, 56%)",
  "hsl(226, 72%, 61%)",
  "hsl(232, 66%, 64%)",
  "hsl(209, 83%, 55%)",
  "hsl(203, 78%, 57%)",
  "hsl(197, 74%, 59%)",
  "hsl(190, 70%, 56%)",
];

// shared axis/text styles
const axisStyle = {
  tickLabelStyle: { fontSize: 10, fill: C_AXIS, fontFamily: "inherit" },
  labelStyle:     { fontSize: 10, fill: C_AXIS, fontFamily: "inherit" },
};

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

// ---------------- ATHLETES PER SPORT — horizontal bar ----------------

interface AthletesPerSportChartProps {
  data: { sport: string; count: number }[];
}

export function AthletesPerSportChart({ data }: AthletesPerSportChartProps) {
  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <ChartCard
      title="Atletas por Deporte"
      subtitle="Distribución según disciplina registrada"
    >
      <BarChart
        layout="horizontal"
        height={210}
        series={[{
          data: sorted.map((d) => d.count),
          color: C_BLUE_MAIN,
          valueFormatter: (v) => (v ?? 0).toLocaleString("es-AR"),
        }]}
        yAxis={[{
          data: sorted.map((d) => d.sport),
          scaleType: "band",
          width: 90,
          ...axisStyle,
          colorMap: {
            type: "ordinal",
            colors: SPORT_COLORS,
          },
        }]}
        xAxis={[{ ...axisStyle, tickNumber: 4 }]}
        borderRadius={6}
        margin={{ left: 4, right: 12, top: 4, bottom: 20 }}
        sx={{
          "& .MuiChartsAxis-line": { display: "none" },
          "& .MuiChartsAxis-tick": { display: "none" },
          "& .MuiChartsLegend-root": { display: "none" },
        }}
        tooltip={{ trigger: "item" }}
        slotProps={{ legend: { hidden: true } }}
      />
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
    { id: 0, value: data.male,   label: "Masculino", color: C_MALE   },
    { id: 1, value: data.female, label: "Femenino",  color: C_FEMALE },
  ];

  return (
    <ChartCard title="Distribución por Género" subtitle="Total de deportistas activos">
      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="shrink-0">
          <PieChart
            width={110}
            height={110}
            series={[{
              data: pieData,
              innerRadius: 30,
              outerRadius: 50,
              paddingAngle: 3,
              startAngle: 90,
              endAngle: 450,
              valueFormatter: (v) => v.value.toLocaleString("es-AR"),
            }]}
            margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
            slotProps={{ legend: { hidden: true } }}
            tooltip={{ trigger: "item" }}
          />
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          {[
            { label: "Masculino", color: C_MALE,   pct: data.malePercent,   count: data.male   },
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
                  <span className="text-sm font-bold font-mono" style={{ color: g.color }}>
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
      <LineChart
        height={160}
        series={[{
          data: data.map((d) => d.count),
          area: true,
          color: C_BLUE_MAIN,
          showMark: true,
          valueFormatter: (v) => (v ?? 0).toLocaleString("es-AR"),
        }]}
        xAxis={[{
          data: data.map((d) => d.range),
          scaleType: "band",
          ...axisStyle,
        }]}
        yAxis={[{ ...axisStyle }]}
        margin={{ left: 40, right: 8, top: 12, bottom: 28 }}
        sx={{
          "& .MuiAreaElement-root": {
            fill: C_BLUE_MAIN,
            fillOpacity: 0.15,
          },
          "& .MuiLineElement-root": { strokeWidth: 2.5 },
          "& .MuiChartsAxis-line": { stroke: "hsl(215, 30%, 88%)" },
          "& .MuiChartsAxis-tick": { display: "none" },
          "& .MuiChartsGrid-line": { stroke: "hsl(215, 30%, 92%)" },
          "& .MuiChartsLegend-root": { display: "none" },
        }}
        grid={{ horizontal: true }}
        tooltip={{ trigger: "item" }}
        slotProps={{ legend: { hidden: true } }}
      />
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

  return (
    <ChartCard title="Top Provincias" subtitle="Por cantidad de atletas registrados">
      <BarChart
        layout="horizontal"
        height={190}
        series={[{
          data: top8.map((d) => d.totalAthletes),
          color: C_BLUE_LIGHT,
          valueFormatter: (v) => (v ?? 0).toLocaleString("es-AR"),
        }]}
        yAxis={[{
          data: top8.map((d) => d.nombre),
          scaleType: "band",
          width: 120,
          ...axisStyle,
        }]}
        xAxis={[{ ...axisStyle, tickNumber: 4 }]}
        borderRadius={6}
        margin={{ left: 4, right: 12, top: 4, bottom: 20 }}
        sx={{
          "& .MuiChartsAxis-line": { display: "none" },
          "& .MuiChartsAxis-tick": { display: "none" },
          "& .MuiChartsLegend-root": { display: "none" },
        }}
        tooltip={{ trigger: "item" }}
        slotProps={{ legend: { hidden: true } }}
      />
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
      <BarChart
        layout="horizontal"
        height={200}
        series={[
          {
            data: sorted.map((d) => d.male),
            label: "Masculino",
            stack: "total",
            color: C_MALE,
            valueFormatter: (v) => (v ?? 0).toLocaleString("es-AR"),
          },
          {
            data: sorted.map((d) => d.female),
            label: "Femenino",
            stack: "total",
            color: C_FEMALE,
            valueFormatter: (v) => (v ?? 0).toLocaleString("es-AR"),
          },
        ]}
        yAxis={[{
          data: sorted.map((d) => d.sport),
          scaleType: "band",
          width: 90,
          ...axisStyle,
        }]}
        xAxis={[{ ...axisStyle, tickNumber: 3 }]}
        borderRadius={4}
        margin={{ left: 4, right: 8, top: 4, bottom: 24 }}
        sx={{
          "& .MuiChartsAxis-line": { display: "none" },
          "& .MuiChartsAxis-tick": { display: "none" },
          "& .MuiChartsLegend-root": {
            fontSize: "10px",
          },
        }}
        tooltip={{ trigger: "item" }}
        slotProps={{
          legend: {
            direction: "row",
            position: { vertical: "bottom", horizontal: "middle" },
            itemMarkWidth: 8,
            itemMarkHeight: 8,
            markGap: 4,
            itemGap: 12,
            labelStyle: { fontSize: 10, fill: C_AXIS, fontFamily: "inherit" },
          },
        }}
      />
    </ChartCard>
  );
}
