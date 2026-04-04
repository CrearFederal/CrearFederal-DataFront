import { useMemo } from 'react';
import { Users, Search, CheckCircle, Clock, XCircle } from 'lucide-react';
import { provincias, deportes } from '../data/mockData';

// ---------------- MOCK DATA ----------------

function seededRand(seed: number) {
  return ((seed * 9301 + 49297) % 233280) / 233280;
}

const FIRST_NAMES_M = ['Agustín', 'Mateo', 'Santiago', 'Nicolás', 'Tomás', 'Facundo', 'Leandro', 'Marcos'];
const FIRST_NAMES_F = ['Valentina', 'Lucía', 'Sofía', 'Camila', 'Florencia', 'Micaela', 'Julieta', 'Paula'];
const LAST_NAMES   = ['García', 'Fernández', 'López', 'Martínez', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Díaz', 'Ruiz'];

type PadronEstado = 'activo' | 'pendiente' | 'inactivo';
const ESTADO_CONFIG: Record<PadronEstado, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  activo:    { label: 'Activo',    icon: CheckCircle, color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
  pendiente: { label: 'Pendiente', icon: Clock,       color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  inactivo:  { label: 'Inactivo',  icon: XCircle,     color: 'text-red-500',    bg: 'bg-red-50 border-red-200' },
};

function mockAtletas(count = 50) {
  return Array.from({ length: count }, (_, i) => {
    const r1 = seededRand(i * 13 + 1);
    const r2 = seededRand(i * 7 + 5);
    const r3 = seededRand(i * 19 + 3);
    const r4 = seededRand(i * 3 + 11);
    const sexo = r1 > 0.48 ? 'M' : 'F';
    const nombres = sexo === 'M' ? FIRST_NAMES_M : FIRST_NAMES_F;
    const nombre = nombres[Math.floor(r2 * nombres.length)];
    const apellido = LAST_NAMES[Math.floor(r3 * LAST_NAMES.length)];
    const deporte = deportes[Math.floor(r4 * deportes.length)];
    const provincia = provincias[Math.floor(seededRand(i * 29) * provincias.length)];
    const anio = 1990 + Math.floor(seededRand(i * 17) * 20);
    const dni = 20000000 + Math.floor(seededRand(i * 41) * 20000000);
    const estado: PadronEstado = r1 < 0.7 ? 'activo' : r1 < 0.88 ? 'pendiente' : 'inactivo';
    const categoria = anio >= 2005 ? 'Sub-20' : anio >= 2000 ? 'Sub-25' : 'Mayor';

    return { id: i + 1, nombre: `${apellido}, ${nombre}`, dni, sexo, anioNac: anio, deporte: deporte.nombre, provincia: provincia.nombre, estado, categoria };
  });
}

// ---------------- COMPONENT ----------------

function PadronModule() {
  const atletas = useMemo(() => mockAtletas(50), []);

  const summary = useMemo(() => ({
    activos:   atletas.filter((a) => a.estado === 'activo').length,
    pendientes: atletas.filter((a) => a.estado === 'pendiente').length,
    inactivos: atletas.filter((a) => a.estado === 'inactivo').length,
  }), [atletas]);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Padrón de Atletas</h2>
          <p className="text-xs text-muted-foreground">
            Legajo único del deportista — {atletas.length} registros en esta federación
          </p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        {(Object.entries(summary) as [PadronEstado, number][]).map(([estado, count]) => {
          const cfg = ESTADO_CONFIG[estado];
          const Icon = cfg.icon;
          return (
            <div key={estado} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 ${cfg.bg}`}>
              <Icon className={`h-4 w-4 ${cfg.color}`} />
              <span className={`text-sm font-semibold ${cfg.color}`}>{count}</span>
              <span className="text-xs text-muted-foreground">{cfg.label}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Buscar por DNI o nombre</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Deportista</th>
              <th className="px-4 py-3 font-medium">DNI</th>
              <th className="px-4 py-3 font-medium">Sexo</th>
              <th className="px-4 py-3 font-medium text-right">Año nac.</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Deporte</th>
              <th className="px-4 py-3 font-medium">Provincia</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {atletas.map((a) => {
              const cfg = ESTADO_CONFIG[a.estado];
              const Icon = cfg.icon;
              return (
                <tr key={a.id} className="transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium text-foreground">{a.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.dni.toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-foreground">{a.sexo}</td>
                  <td className="px-4 py-3 text-right text-foreground">{a.anioNac}</td>
                  <td className="px-4 py-3 text-foreground">{a.categoria}</td>
                  <td className="px-4 py-3 text-foreground">{a.deporte}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.provincia}</td>
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

export default PadronModule;
