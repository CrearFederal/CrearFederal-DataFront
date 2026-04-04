import { useMemo } from 'react';
import { Flag, Star, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { provincias, deportes } from '../data/mockData';

// ---------------- MOCK DATA ----------------

function seededRand(seed: number) {
  return ((seed * 9301 + 49297) % 233280) / 233280;
}

const LAST_NAMES  = ['García', 'Fernández', 'López', 'Martínez', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Torres'];
const FIRST_NAMES = ['Agustín', 'Valentina', 'Mateo', 'Lucía', 'Santiago', 'Sofía', 'Nicolás', 'Camila', 'Tomás', 'Florencia'];

const COMPETENCIAS = [
  'Juegos Panamericanos 2027',
  'Juegos Sudamericanos 2026',
  'Campeonato Sudamericano 2025',
  'Copa América 2026',
  'Mundial Juvenil 2025',
];

type Lista = 'short' | 'long' | 'reserva';
const LISTA_CONFIG: Record<Lista, { label: string; color: string; bg: string }> = {
  short:   { label: 'Short List', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  long:    { label: 'Long List',  color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200' },
  reserva: { label: 'Reserva',    color: 'text-gray-600',   bg: 'bg-gray-100 border-gray-200' },
};

function mockSeleccionados(count = 35) {
  return Array.from({ length: count }, (_, i) => {
    const r1 = seededRand(i * 7 + 3);
    const r2 = seededRand(i * 11 + 5);
    const r3 = seededRand(i * 17 + 1);
    const deporte = deportes[Math.floor(seededRand(i * 13) * deportes.length)];
    const provincia = provincias[Math.floor(r2 * provincias.length)];
    const nombre = `${LAST_NAMES[i % LAST_NAMES.length]}, ${FIRST_NAMES[i % FIRST_NAMES.length]}`;
    const competencia = COMPETENCIAS[Math.floor(r3 * COMPETENCIAS.length)];
    const lista: Lista = r1 < 0.25 ? 'short' : r1 < 0.7 ? 'long' : 'reserva';
    const edad = 16 + Math.floor(seededRand(i * 29) * 14);
    const aptoMedico = seededRand(i * 41) > 0.15;
    const puntaje = Math.floor(70 + seededRand(i * 19) * 30);

    return { id: i + 1, nombre, edad, deporte: deporte.nombre, provincia: provincia.nombre, competencia, lista, aptoMedico, puntaje };
  }).sort((a, b) => {
    const order: Record<Lista, number> = { short: 0, long: 1, reserva: 2 };
    return order[a.lista] - order[b.lista] || b.puntaje - a.puntaje;
  });
}

// ---------------- COMPONENT ----------------

function MisionesModule() {
  const seleccionados = useMemo(() => mockSeleccionados(35), []);

  const summary = useMemo(() => ({
    short:   seleccionados.filter((s) => s.lista === 'short').length,
    long:    seleccionados.filter((s) => s.lista === 'long').length,
    reserva: seleccionados.filter((s) => s.lista === 'reserva').length,
    aptos:   seleccionados.filter((s) => s.aptoMedico).length,
  }), [seleccionados]);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Flag className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Proyección a Misiones</h2>
          <p className="text-xs text-muted-foreground">
            Long list y short list para selecciones nacionales — {seleccionados.length} deportistas
          </p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2.5">
          <Star className="h-4 w-4 text-yellow-700" />
          <span className="text-sm font-semibold text-yellow-700">{summary.short}</span>
          <span className="text-xs text-muted-foreground">Short List</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
          <span className="text-sm font-semibold text-blue-600">{summary.long}</span>
          <span className="text-xs text-muted-foreground">Long List</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-100 px-4 py-2.5">
          <span className="text-sm font-semibold text-gray-600">{summary.reserva}</span>
          <span className="text-xs text-muted-foreground">Reserva</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold text-green-600">{summary.aptos}</span>
          <span className="text-xs text-muted-foreground">Aptos médicos</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Lista</th>
              <th className="px-4 py-3 font-medium">Deportista</th>
              <th className="px-4 py-3 font-medium">Deporte</th>
              <th className="px-4 py-3 font-medium">Provincia</th>
              <th className="px-4 py-3 font-medium text-right">Edad</th>
              <th className="px-4 py-3 font-medium">Competencia</th>
              <th className="px-4 py-3 font-medium text-right">Puntaje</th>
              <th className="px-4 py-3 font-medium">Apto médico</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {seleccionados.map((s) => {
              const listaCfg = LISTA_CONFIG[s.lista];
              return (
                <tr key={s.id} className="transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${listaCfg.bg} ${listaCfg.color}`}>
                      {listaCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{s.nombre}</td>
                  <td className="px-4 py-3 text-foreground">{s.deporte}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.provincia}</td>
                  <td className="px-4 py-3 text-right text-foreground">{s.edad}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.competencia}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{s.puntaje}</td>
                  <td className="px-4 py-3">
                    {s.aptoMedico
                      ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                      : <Circle className="h-4 w-4 text-muted-foreground/40" />}
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
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

export default MisionesModule;
