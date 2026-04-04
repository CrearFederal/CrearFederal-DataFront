import { useMemo } from 'react';
import { MapPin, Building2, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { getClubes } from '../data/dataUtils';

// ---------------- MOCK DATA ----------------

function seededRand(seed: number) {
  return ((seed * 9301 + 49297) % 233280) / 233280;
}

type InfraEstado = 'optimo' | 'regular' | 'deficiente';
const INFRA_CONFIG: Record<InfraEstado, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  optimo:     { label: 'Óptimo',     icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  regular:    { label: 'Regular',    icon: AlertCircle,  color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  deficiente: { label: 'Deficiente', icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-50 border-red-200' },
};

const TIPOS = ['Club deportivo', 'Centro comunal', 'Polideportivo municipal', 'Estadio', 'Natatorio', 'Cancha de fútbol'];

function mockInstituciones() {
  const clubes = getClubes();
  return clubes.slice(0, 40).map((c, i) => {
    const r1 = seededRand(i * 7 + 3);
    const r2 = seededRand(i * 11 + 5);
    const r3 = seededRand(i * 17 + 1);

    const estado: InfraEstado = r1 < 0.45 ? 'optimo' : r1 < 0.78 ? 'regular' : 'deficiente';
    const tipo = TIPOS[Math.floor(r2 * TIPOS.length)];
    const deportistas = Math.floor(20 + r3 * 180);
    const superficieCubierta = Math.floor(200 + seededRand(i * 23) * 1800);
    const habilitacion = estado !== 'deficiente';
    const ultimaInspeccion = `2025-${String(Math.floor(seededRand(i * 29) * 12) + 1).padStart(2, '0')}-10`;

    return {
      id: c.id_club,
      nombre: c.nombre,
      tipo,
      estado,
      deportistas,
      superficieCubierta,
      habilitacion,
      ultimaInspeccion,
      direccion: c.direccion,
    };
  });
}

// ---------------- COMPONENT ----------------

function TerritorioModule() {
  const instituciones = useMemo(() => mockInstituciones(), []);

  const summary = useMemo(() => ({
    optimo:     instituciones.filter((i) => i.estado === 'optimo').length,
    regular:    instituciones.filter((i) => i.estado === 'regular').length,
    deficiente: instituciones.filter((i) => i.estado === 'deficiente').length,
    habilitadas: instituciones.filter((i) => i.habilitacion).length,
  }), [instituciones]);

  const totalDeportistas = useMemo(
    () => instituciones.reduce((s, i) => s + i.deportistas, 0),
    [instituciones]
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Gestión del Territorio</h2>
          <p className="text-xs text-muted-foreground">
            Infraestructura y censo de instituciones — {instituciones.length} instituciones registradas
          </p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        {(Object.entries({ optimo: summary.optimo, regular: summary.regular, deficiente: summary.deficiente }) as [InfraEstado, number][]).map(([estado, count]) => {
          const cfg = INFRA_CONFIG[estado];
          const Icon = cfg.icon;
          return (
            <div key={estado} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 ${cfg.bg}`}>
              <Icon className={`h-4 w-4 ${cfg.color}`} />
              <span className={`text-sm font-semibold ${cfg.color}`}>{count}</span>
              <span className="text-xs text-muted-foreground">{cfg.label}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">{summary.habilitadas}</span>
          <span className="text-xs text-muted-foreground">Habilitadas</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5">
          <span className="text-sm font-semibold text-foreground">{totalDeportistas.toLocaleString('es-AR')}</span>
          <span className="text-xs text-muted-foreground">Deportistas totales</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Institución</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Dirección</th>
              <th className="px-4 py-3 font-medium text-right">Deportistas</th>
              <th className="px-4 py-3 font-medium text-right">Sup. cubierta m²</th>
              <th className="px-4 py-3 font-medium">Habilitación</th>
              <th className="px-4 py-3 font-medium">Últ. inspección</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {instituciones.map((inst) => {
              const cfg = INFRA_CONFIG[inst.estado];
              const Icon = cfg.icon;
              return (
                <tr key={inst.id} className="transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium text-foreground">{inst.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inst.tipo}</td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[12rem]">{inst.direccion}</td>
                  <td className="px-4 py-3 text-right text-foreground">{inst.deportistas}</td>
                  <td className="px-4 py-3 text-right text-foreground">{inst.superficieCubierta.toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3">
                    {inst.habilitacion
                      ? <CheckCircle className="h-4 w-4 text-green-600" />
                      : <XCircle className="h-4 w-4 text-red-500" />}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{inst.ultimaInspeccion}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${cfg.bg} ${cfg.color}`}>
                      <Icon className="h-3 w-3" />
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

export default TerritorioModule;
