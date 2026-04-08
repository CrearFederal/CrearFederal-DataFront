import { useMemo } from 'react';
import { Star, TrendingUp, Award, Eye } from 'lucide-react';
import { provincias, deportes } from '../data/mockData';

// ---------------- MOCK DATA ----------------

function seededRand(seed: number) {
  return ((seed * 9301 + 49297) % 233280) / 233280;
}

const FIRST_NAMES = ['Valentina', 'Lucía', 'Agustín', 'Mateo', 'Sofía', 'Tomás', 'Camila', 'Santiago', 'Florencia', 'Nicolás'];
const LAST_NAMES = ['García', 'Fernández', 'López', 'Martínez', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Torres'];

type TalentoNivel = 'elite' | 'proyeccion' | 'seguimiento';
const NIVEL_CONFIG: Record<TalentoNivel, { label: string; color: string; bg: string }> = {
  elite:      { label: 'Élite',       color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  proyeccion: { label: 'Proyección',  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  seguimiento:{ label: 'Seguimiento', color: 'text-gray-600',   bg: 'bg-gray-100 border-gray-200' },
};

function mockTalentos() {
  return Array.from({ length: 40 }, (_, i) => {
    const r1 = seededRand(i * 17 + 3);
    const r2 = seededRand(i * 11 + 7);
    const r3 = seededRand(i * 5 + 13);
    const r4 = seededRand(i * 23 + 2);

    const deporte = deportes[Math.floor(r1 * deportes.length)];
    const provincia = provincias[Math.floor(r2 * provincias.length)];
    const nivel: TalentoNivel = r3 < 0.15 ? 'elite' : r3 < 0.5 ? 'proyeccion' : 'seguimiento';
    const edad = 12 + Math.floor(r4 * 11);
    const nombre = FIRST_NAMES[i % FIRST_NAMES.length];
    const apellido = LAST_NAMES[Math.floor(r2 * LAST_NAMES.length)];
    const puntaje = Math.floor(70 + r3 * 30);
    const beca = nivel === 'elite' || (nivel === 'proyeccion' && r4 > 0.6);

    return { id: i + 1, nombre: `${apellido}, ${nombre}`, deporte: deporte.nombre, provincia: provincia.nombre, edad, nivel, puntaje, beca };
  }).sort((a, b) => b.puntaje - a.puntaje);
}

// ---------------- COMPONENT ----------------

function TalentoModule() {
  const talentos = useMemo(() => mockTalentos(), []);

  const summary = useMemo(() => ({
    elite:       talentos.filter((t) => t.nivel === 'elite').length,
    proyeccion:  talentos.filter((t) => t.nivel === 'proyeccion').length,
    seguimiento: talentos.filter((t) => t.nivel === 'seguimiento').length,
    becados:     talentos.filter((t) => t.beca).length,
  }), [talentos]);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Star className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Monitor de Talento</h2>
          <p className="text-xs text-muted-foreground">
            Detección y seguimiento de {talentos.length} talentos deportivos identificados
          </p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2.5">
          <Award className="h-4 w-4 text-yellow-700" />
          <span className="text-sm font-semibold text-yellow-700">{summary.elite}</span>
          <span className="text-xs text-muted-foreground">Élite</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-600">{summary.proyeccion}</span>
          <span className="text-xs text-muted-foreground">Proyección</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5">
          <Eye className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-600">{summary.seguimiento}</span>
          <span className="text-xs text-muted-foreground">Seguimiento</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5">
          <span className="text-sm font-semibold text-foreground">{summary.becados}</span>
          <span className="text-xs text-muted-foreground">Con beca CReAR</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Deportista</th>
              <th className="px-4 py-3 font-medium">Deporte</th>
              <th className="px-4 py-3 font-medium">Provincia</th>
              <th className="px-4 py-3 font-medium text-right">Edad</th>
              <th className="px-4 py-3 font-medium text-right">Puntaje</th>
              <th className="px-4 py-3 font-medium">Beca</th>
              <th className="px-4 py-3 font-medium">Nivel</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {talentos.map((t, idx) => {
              const cfg = NIVEL_CONFIG[t.nivel];
              return (
                <tr key={t.id} className="transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{t.nombre}</td>
                  <td className="px-4 py-3 text-foreground">{t.deporte}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.provincia}</td>
                  <td className="px-4 py-3 text-right text-foreground">{t.edad}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{t.puntaje}</td>
                  <td className="px-4 py-3">
                    {t.beca ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700">
                        Sí
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TalentoModule;
