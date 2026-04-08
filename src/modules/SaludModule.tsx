import { useMemo } from 'react';
import { Stethoscope, CheckCircle2, AlertCircle, XCircle, Calendar } from 'lucide-react';
import { deportes } from '../data/mockData';

// ---------------- MOCK DATA ----------------

function seededRand(seed: number) {
  return ((seed * 9301 + 49297) % 233280) / 233280;
}

const LAST_NAMES  = ['García', 'Fernández', 'López', 'Martínez', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Torres'];
const FIRST_NAMES = ['Agustín', 'Valentina', 'Mateo', 'Lucía', 'Santiago', 'Sofía', 'Nicolás', 'Camila', 'Tomás', 'Florencia'];

type AptEstado = 'apto' | 'condicional' | 'no_apto' | 'vencido';
const APT_CONFIG: Record<AptEstado, { label: string; icon: typeof CheckCircle2; color: string; bg: string }> = {
  apto:        { label: 'Apto',        icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  condicional: { label: 'Condicional', icon: AlertCircle,  color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  no_apto:     { label: 'No apto',     icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-50 border-red-200' },
  vencido:     { label: 'Vencido',     icon: Calendar,     color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
};

const ESTUDIOS = ['ECG basal', 'Ecocardiograma', 'Ergometría', 'Espirometría', 'Laboratorio completo'];

function mockSalud(count = 30) {
  return Array.from({ length: count }, (_, i) => {
    const r1 = seededRand(i * 7 + 3);
    const r2 = seededRand(i * 11 + 5);
    const r3 = seededRand(i * 17 + 1);

    const nombre = `${LAST_NAMES[i % LAST_NAMES.length]}, ${FIRST_NAMES[i % FIRST_NAMES.length]}`;
    const deporte = deportes[Math.floor(r2 * deportes.length)];
    const edad = 14 + Math.floor(r3 * 16);
    const estado: AptEstado = r1 < 0.6 ? 'apto' : r1 < 0.75 ? 'condicional' : r1 < 0.87 ? 'vencido' : 'no_apto';
    const mesVenc = Math.floor(seededRand(i * 23) * 12) + 1;
    const anioVenc = estado === 'vencido' ? 2024 : 2025;
    const vencimiento = `${anioVenc}-${String(mesVenc).padStart(2, '0')}-15`;
    const estudio = ESTUDIOS[Math.floor(seededRand(i * 31) * ESTUDIOS.length)];
    const pasaporte = estado === 'apto';

    return { id: i + 1, nombre, edad, deporte: deporte.nombre, estado, vencimiento, estudio, pasaporte };
  });
}

// ---------------- COMPONENT ----------------

function SaludModule() {
  const atletas = useMemo(() => mockSalud(30), []);

  const summary = useMemo(() => ({
    aptos:       atletas.filter((a) => a.estado === 'apto').length,
    condicional: atletas.filter((a) => a.estado === 'condicional').length,
    no_apto:     atletas.filter((a) => a.estado === 'no_apto').length,
    vencidos:    atletas.filter((a) => a.estado === 'vencido').length,
  }), [atletas]);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Stethoscope className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Salud y Aptos Médicos</h2>
          <p className="text-xs text-muted-foreground">
            Aptos médicos y pasaporte sanitario — {atletas.length} deportistas
          </p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        {(Object.entries(summary) as [AptEstado, number][]).map(([estado, count]) => {
          const cfg = APT_CONFIG[estado];
          const Icon = cfg.icon;
          return (
            <div key={estado} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 ${cfg.bg}`}>
              <Icon className={`h-4 w-4 ${cfg.color}`} />
              <span className={`text-sm font-semibold ${cfg.color}`}>{count}</span>
              <span className="text-xs text-muted-foreground">{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Deportista</th>
              <th className="px-4 py-3 font-medium text-right">Edad</th>
              <th className="px-4 py-3 font-medium">Deporte</th>
              <th className="px-4 py-3 font-medium">Estado apto</th>
              <th className="px-4 py-3 font-medium">Vencimiento</th>
              <th className="px-4 py-3 font-medium">Último estudio</th>
              <th className="px-4 py-3 font-medium">Pasaporte sanitario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {atletas.map((a) => {
              const cfg = APT_CONFIG[a.estado];
              const Icon = cfg.icon;
              return (
                <tr key={a.id} className="transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium text-foreground">{a.nombre}</td>
                  <td className="px-4 py-3 text-right text-foreground">{a.edad}</td>
                  <td className="px-4 py-3 text-foreground">{a.deporte}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${cfg.bg} ${cfg.color}`}>
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </td>
                  <td className={`px-4 py-3 ${a.estado === 'vencido' ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                    {a.vencimiento}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.estudio}</td>
                  <td className="px-4 py-3">
                    {a.pasaporte
                      ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                      : <span className="text-muted-foreground/40 text-xs">—</span>}
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

export default SaludModule;
