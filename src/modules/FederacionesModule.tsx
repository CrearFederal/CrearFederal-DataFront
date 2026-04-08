import { useMemo } from 'react';
import { CheckCircle, AlertCircle, XCircle, Shield } from 'lucide-react';
import { provincias, deportes } from '../data/mockData';
import { getClubes } from '../data/dataUtils';

// ---------------- MOCK DATA ----------------

const FEDERATION_STATUSES = ['active', 'warning', 'inactive'] as const;
type FedStatus = typeof FEDERATION_STATUSES[number];

function seededRand(seed: number) {
  let s = seed * 9301 + 49297;
  return ((s % 233280) / 233280);
}

function mockFederations() {
  return deportes.map((d, i) => {
    const rand = seededRand(d.id_deporte * 17);
    const statusIdx = Math.floor(rand * 3);
    const status: FedStatus = FEDERATION_STATUSES[statusIdx];
    const clubs = getClubes();
    const affiliated = Math.floor(clubs.length * (0.3 + seededRand(i * 7) * 0.5));
    const athletes = affiliated * (Math.floor(seededRand(i * 13) * 8) + 5);

    return {
      id: d.id_deporte,
      nombre: `Confederación Argentina de ${d.nombre}`,
      sigla: `CAF${d.nombre.substring(0, 2).toUpperCase()}`,
      deporte: d.nombre,
      status,
      clubesAfiliados: affiliated,
      atletasRegistrados: athletes,
      ultimaActualizacion: `2025-${String(Math.floor(seededRand(i) * 12) + 1).padStart(2, '0')}-15`,
      provinciasActivas: Math.floor(seededRand(i * 11) * 10) + 14,
    };
  });
}

// ---------------- HELPERS ----------------

const STATUS_CONFIG: Record<FedStatus, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  active:   { label: 'Activa',    icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  warning:  { label: 'Advertencia', icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  inactive: { label: 'Inactiva',  icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-50 border-red-200' },
};

// ---------------- COMPONENT ----------------

function FederacionesModule() {
  const federations = useMemo(() => mockFederations(), []);

  const summary = useMemo(() => ({
    active:   federations.filter((f) => f.status === 'active').length,
    warning:  federations.filter((f) => f.status === 'warning').length,
    inactive: federations.filter((f) => f.status === 'inactive').length,
  }), [federations]);

  const totalProvincias = provincias.length;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Auditoría Federativa</h2>
          <p className="text-xs text-muted-foreground">
            Estado legal y técnico de las {federations.length} Confederaciones Nacionales
          </p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3">
        {(Object.entries(summary) as [FedStatus, number][]).map(([status, count]) => {
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          return (
            <div key={status} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 ${cfg.bg}`}>
              <Icon className={`h-4 w-4 ${cfg.color}`} />
              <span className={`text-sm font-semibold ${cfg.color}`}>{count}</span>
              <span className="text-xs text-muted-foreground">{cfg.label}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5">
          <span className="text-sm font-semibold text-foreground">{totalProvincias}</span>
          <span className="text-xs text-muted-foreground">Provincias adheridas</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Confederación</th>
              <th className="px-4 py-3 font-medium">Deporte</th>
              <th className="px-4 py-3 font-medium text-right">Clubes afil.</th>
              <th className="px-4 py-3 font-medium text-right">Atletas</th>
              <th className="px-4 py-3 font-medium text-right">Prov. activas</th>
              <th className="px-4 py-3 font-medium">Últ. actualiz.</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {federations.map((fed) => {
              const cfg = STATUS_CONFIG[fed.status];
              const Icon = cfg.icon;
              return (
                <tr key={fed.id} className="transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{fed.nombre}</div>
                    <div className="text-muted-foreground">{fed.sigla}</div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{fed.deporte}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">
                    {fed.clubesAfiliados.toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">
                    {fed.atletasRegistrados.toLocaleString('es-AR')}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground">
                    {fed.provinciasActivas} / {totalProvincias}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{fed.ultimaActualizacion}</td>
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

export default FederacionesModule;
