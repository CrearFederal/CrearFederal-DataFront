import { useMemo } from 'react';
import { UserCheck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { deportes } from '../data/mockData';

// ---------------- MOCK DATA ----------------

function seededRand(seed: number) {
  return ((seed * 9301 + 49297) % 233280) / 233280;
}

const LAST_NAMES  = ['García', 'Fernández', 'López', 'Martínez', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Torres'];
const FIRST_NAMES = ['Agustín', 'Valentina', 'Mateo', 'Lucía', 'Santiago', 'Sofía', 'Nicolás', 'Camila', 'Tomás', 'Florencia'];

type AsistenciaEstado = 'presente' | 'ausente' | 'justificado';
const ASISTENCIA_CONFIG: Record<AsistenciaEstado, { label: string; icon: typeof CheckCircle; color: string }> = {
  presente:    { label: 'Presente',    icon: CheckCircle, color: 'text-green-600' },
  ausente:     { label: 'Ausente',     icon: XCircle,     color: 'text-red-500' },
  justificado: { label: 'Justificado', icon: Clock,       color: 'text-yellow-600' },
};

function mockAtletas(count = 30) {
  return Array.from({ length: count }, (_, i) => {
    const r1 = seededRand(i * 7 + 3);
    const r2 = seededRand(i * 11 + 5);
    const r3 = seededRand(i * 17 + 1);
    const r4 = seededRand(i * 23 + 9);

    const nombre = `${LAST_NAMES[i % LAST_NAMES.length]}, ${FIRST_NAMES[i % FIRST_NAMES.length]}`;
    const deporte = deportes[Math.floor(r2 * deportes.length)];
    const edad = 10 + Math.floor(r3 * 18);
    const dni = 20000000 + Math.floor(seededRand(i * 41) * 20000000);
    const asistencia: AsistenciaEstado = r1 < 0.72 ? 'presente' : r1 < 0.88 ? 'ausente' : 'justificado';
    const asistenciaPct = Math.floor(60 + r4 * 40);
    const categoria = edad <= 14 ? 'Infantil' : edad <= 17 ? 'Juvenil' : edad <= 20 ? 'Sub-21' : 'Mayor';
    const activo = r1 < 0.85;
    const fichaCompleta = seededRand(i * 53) > 0.3;

    return { id: i + 1, nombre, dni, edad, deporte: deporte.nombre, categoria, asistencia, asistenciaPct, activo, fichaCompleta };
  });
}

// ---------------- COMPONENT ----------------

function AtletasModule() {
  const atletas = useMemo(() => mockAtletas(30), []);

  const summary = useMemo(() => ({
    activos:      atletas.filter((a) => a.activo).length,
    presentes:    atletas.filter((a) => a.asistencia === 'presente').length,
    fichaOk:      atletas.filter((a) => a.fichaCompleta).length,
    asistProm:    Math.round(atletas.reduce((s, a) => s + a.asistenciaPct, 0) / atletas.length),
  }), [atletas]);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <UserCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Gestión de Atletas</h2>
          <p className="text-xs text-muted-foreground">
            Fichas, asistencia y seguimiento — {atletas.length} deportistas del club
          </p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5">
          <span className="text-sm font-semibold text-green-600">{summary.activos}</span>
          <span className="text-xs text-muted-foreground">Activos</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-600">{summary.presentes}</span>
          <span className="text-xs text-muted-foreground">Presentes hoy</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5">
          <span className="text-sm font-semibold text-foreground">{summary.asistProm}%</span>
          <span className="text-xs text-muted-foreground">Asist. promedio</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5">
          <span className="text-sm font-semibold text-foreground">{summary.fichaOk}</span>
          <span className="text-xs text-muted-foreground">Fichas completas</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Deportista</th>
              <th className="px-4 py-3 font-medium">DNI</th>
              <th className="px-4 py-3 font-medium text-right">Edad</th>
              <th className="px-4 py-3 font-medium">Deporte</th>
              <th className="px-4 py-3 font-medium">Categoría</th>
              <th className="px-4 py-3 font-medium">Asist. hoy</th>
              <th className="px-4 py-3 font-medium text-right">% Asist.</th>
              <th className="px-4 py-3 font-medium">Ficha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {atletas.map((a) => {
              const asistCfg = ASISTENCIA_CONFIG[a.asistencia];
              const AsistIcon = asistCfg.icon;
              return (
                <tr key={a.id} className="transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium text-foreground">{a.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.dni.toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-right text-foreground">{a.edad}</td>
                  <td className="px-4 py-3 text-foreground">{a.deporte}</td>
                  <td className="px-4 py-3 text-foreground">{a.categoria}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 ${asistCfg.color}`}>
                      <AsistIcon className="h-3.5 w-3.5" />
                      {asistCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={a.asistenciaPct >= 80 ? 'text-green-600' : a.asistenciaPct >= 60 ? 'text-yellow-600' : 'text-red-500'}>
                      {a.asistenciaPct}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {a.fichaCompleta
                      ? <CheckCircle className="h-4 w-4 text-green-600" />
                      : <span className="text-xs text-yellow-600">Incompleta</span>}
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

export default AtletasModule;
