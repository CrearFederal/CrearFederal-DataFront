import { useMemo } from 'react';
import { ClipboardList, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { deportes } from '../data/mockData';

// ---------------- MOCK DATA ----------------

function seededRand(seed: number) {
  return ((seed * 9301 + 49297) % 233280) / 233280;
}

const LAST_NAMES   = ['García', 'Fernández', 'López', 'Martínez', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Torres'];
const FIRST_NAMES  = ['Agustín', 'Valentina', 'Mateo', 'Lucía', 'Santiago', 'Sofía', 'Nicolás', 'Camila', 'Tomás', 'Florencia'];

type Tendencia = 'up' | 'down' | 'stable';

function score(seed: number, base: number, range: number) {
  return +(base + seededRand(seed) * range).toFixed(1);
}

function mockEvaluaciones(count = 30) {
  return Array.from({ length: count }, (_, i) => {
    const r = seededRand(i * 7 + 3);
    const deporte = deportes[Math.floor(seededRand(i * 11) * deportes.length)];
    const nombre = `${LAST_NAMES[i % LAST_NAMES.length]}, ${FIRST_NAMES[i % FIRST_NAMES.length]}`;
    const edad = 14 + Math.floor(seededRand(i * 5) * 12);
    const velocidad   = score(i * 3,  8.5, 3.5);
    const resistencia = score(i * 13, 55, 30);
    const fuerza      = score(i * 7,  40, 40);
    const flexibilidad= score(i * 17, 15, 20);
    const puntajeTotal= Math.round((velocidad / 12 * 30 + resistencia / 85 * 25 + fuerza / 80 * 25 + flexibilidad / 35 * 20));
    const tendencia: Tendencia = r < 0.4 ? 'up' : r < 0.65 ? 'stable' : 'down';
    const fecha = `2025-${String(Math.floor(seededRand(i * 23) * 11) + 1).padStart(2, '0')}-15`;

    return { id: i + 1, nombre, edad, deporte: deporte.nombre, velocidad, resistencia, fuerza, flexibilidad, puntajeTotal, tendencia, fecha };
  }).sort((a, b) => b.puntajeTotal - a.puntajeTotal);
}

const TENDENCIA_ICON: Record<Tendencia, { Icon: typeof TrendingUp; color: string }> = {
  up:     { Icon: TrendingUp,   color: 'text-green-600' },
  down:   { Icon: TrendingDown, color: 'text-red-500' },
  stable: { Icon: Minus,        color: 'text-muted-foreground' },
};

// ---------------- COMPONENT ----------------

function EvaluacionesModule() {
  const evaluaciones = useMemo(() => mockEvaluaciones(30), []);

  const avg = useMemo(() => {
    const n = evaluaciones.length;
    return {
      vel:  (evaluaciones.reduce((s, e) => s + e.velocidad, 0) / n).toFixed(1),
      res:  (evaluaciones.reduce((s, e) => s + e.resistencia, 0) / n).toFixed(0),
      fue:  (evaluaciones.reduce((s, e) => s + e.fuerza, 0) / n).toFixed(0),
      fle:  (evaluaciones.reduce((s, e) => s + e.flexibilidad, 0) / n).toFixed(1),
      pts:  Math.round(evaluaciones.reduce((s, e) => s + e.puntajeTotal, 0) / n),
    };
  }, [evaluaciones]);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Evaluaciones Físicas</h2>
          <p className="text-xs text-muted-foreground">
            Biometría y rendimiento físico — {evaluaciones.length} evaluaciones registradas
          </p>
        </div>
      </div>

      {/* Averages */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: 'Velocidad (s)', value: avg.vel, unit: '100m' },
          { label: 'Resistencia', value: avg.res, unit: 'VO₂max' },
          { label: 'Fuerza (kg)', value: avg.fue, unit: 'press' },
          { label: 'Flexibilidad', value: avg.fle, unit: 'cm' },
          { label: 'Puntaje medio', value: avg.pts, unit: '/100' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-card px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {item.value}
              <span className="text-xs font-normal text-muted-foreground ml-1">{item.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Deportista</th>
              <th className="px-4 py-3 font-medium">Deporte</th>
              <th className="px-4 py-3 font-medium text-right">Edad</th>
              <th className="px-4 py-3 font-medium text-right">Vel. 100m</th>
              <th className="px-4 py-3 font-medium text-right">VO₂max</th>
              <th className="px-4 py-3 font-medium text-right">Fuerza</th>
              <th className="px-4 py-3 font-medium text-right">Flex.</th>
              <th className="px-4 py-3 font-medium text-right">Puntaje</th>
              <th className="px-4 py-3 font-medium">Tend.</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {evaluaciones.map((e, idx) => {
              const { Icon, color } = TENDENCIA_ICON[e.tendencia];
              return (
                <tr key={e.id} className="transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{e.nombre}</td>
                  <td className="px-4 py-3 text-foreground">{e.deporte}</td>
                  <td className="px-4 py-3 text-right text-foreground">{e.edad}</td>
                  <td className="px-4 py-3 text-right text-foreground">{e.velocidad}</td>
                  <td className="px-4 py-3 text-right text-foreground">{e.resistencia}</td>
                  <td className="px-4 py-3 text-right text-foreground">{e.fuerza}</td>
                  <td className="px-4 py-3 text-right text-foreground">{e.flexibilidad}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{e.puntajeTotal}</td>
                  <td className="px-4 py-3">
                    <Icon className={`h-4 w-4 ${color}`} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.fecha}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EvaluacionesModule;
