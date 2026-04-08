import { useMemo } from 'react';
import { Heart, GraduationCap, AlertTriangle, CheckCircle } from 'lucide-react';
import { provincias } from '../data/mockData';

// ---------------- MOCK DATA ----------------

function seededRand(seed: number) {
  return ((seed * 9301 + 49297) % 233280) / 233280;
}

const LAST_NAMES  = ['García', 'Fernández', 'López', 'Martínez', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Torres'];
const FIRST_NAMES = ['Agustín', 'Valentina', 'Mateo', 'Lucía', 'Santiago', 'Sofía', 'Nicolás', 'Camila', 'Tomás', 'Florencia'];

type NivelVulnerabilidad = 'alto' | 'medio' | 'bajo';
type SituacionEscolar = 'regular' | 'irregular' | 'egresado' | 'fuera';

const VULN_CONFIG: Record<NivelVulnerabilidad, { label: string; color: string; bg: string }> = {
  alto:  { label: 'Alto',  color: 'text-red-600',    bg: 'bg-red-50 border-red-200' },
  medio: { label: 'Medio', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  bajo:  { label: 'Bajo',  color: 'text-green-600',  bg: 'bg-green-50 border-green-200' },
};

const ESCOLAR_CONFIG: Record<SituacionEscolar, { label: string; color: string }> = {
  regular:   { label: 'Regular',   color: 'text-green-600' },
  irregular: { label: 'Irregular', color: 'text-yellow-600' },
  egresado:  { label: 'Egresado',  color: 'text-muted-foreground' },
  fuera:     { label: 'Fuera',     color: 'text-red-500' },
};

function mockSocial(count = 40) {
  return Array.from({ length: count }, (_, i) => {
    const r1 = seededRand(i * 7 + 3);
    const r2 = seededRand(i * 11 + 5);
    const r3 = seededRand(i * 17 + 1);
    const r4 = seededRand(i * 23 + 9);

    const nombre = `${LAST_NAMES[i % LAST_NAMES.length]}, ${FIRST_NAMES[i % FIRST_NAMES.length]}`;
    const provincia = provincias[Math.floor(r2 * provincias.length)];
    const edad = 10 + Math.floor(r3 * 16);
    const vuln: NivelVulnerabilidad = r1 < 0.2 ? 'alto' : r1 < 0.55 ? 'medio' : 'bajo';
    const escolar: SituacionEscolar = r4 < 0.6 ? 'regular' : r4 < 0.78 ? 'irregular' : r4 < 0.9 ? 'egresado' : 'fuera';
    const becaBienestar = vuln !== 'bajo' && seededRand(i * 31) > 0.5;
    const acompaniamiento = vuln === 'alto' || (vuln === 'medio' && seededRand(i * 13) > 0.6);

    return { id: i + 1, nombre, edad, provincia: provincia.nombre, vuln, escolar, becaBienestar, acompaniamiento };
  });
}

// ---------------- COMPONENT ----------------

function SocialModule() {
  const atletas = useMemo(() => mockSocial(40), []);

  const summary = useMemo(() => ({
    vuln_alto:   atletas.filter((a) => a.vuln === 'alto').length,
    vuln_medio:  atletas.filter((a) => a.vuln === 'medio').length,
    becas:       atletas.filter((a) => a.becaBienestar).length,
    escolar_ok:  atletas.filter((a) => a.escolar === 'regular').length,
  }), [atletas]);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Heart className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Inclusión Social</h2>
          <p className="text-xs text-muted-foreground">
            Vulnerabilidad, escolaridad y bienestar — {atletas.length} deportistas monitoreados
          </p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm font-semibold text-red-600">{summary.vuln_alto}</span>
          <span className="text-xs text-muted-foreground">Vulnerabilidad alta</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2.5">
          <span className="text-sm font-semibold text-yellow-700">{summary.vuln_medio}</span>
          <span className="text-xs text-muted-foreground">Vulnerabilidad media</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-4 py-2.5">
          <Heart className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-semibold text-purple-600">{summary.becas}</span>
          <span className="text-xs text-muted-foreground">Beca bienestar</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5">
          <GraduationCap className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold text-green-600">{summary.escolar_ok}</span>
          <span className="text-xs text-muted-foreground">Escolaridad regular</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Deportista</th>
              <th className="px-4 py-3 font-medium text-right">Edad</th>
              <th className="px-4 py-3 font-medium">Provincia</th>
              <th className="px-4 py-3 font-medium">Vulnerabilidad</th>
              <th className="px-4 py-3 font-medium">Escolaridad</th>
              <th className="px-4 py-3 font-medium">Beca bienestar</th>
              <th className="px-4 py-3 font-medium">Acompañamiento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {atletas.map((a) => {
              const vulnCfg = VULN_CONFIG[a.vuln];
              const escolarCfg = ESCOLAR_CONFIG[a.escolar];
              return (
                <tr key={a.id} className="transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium text-foreground">{a.nombre}</td>
                  <td className="px-4 py-3 text-right text-foreground">{a.edad}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.provincia}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${vulnCfg.bg} ${vulnCfg.color}`}>
                      {vulnCfg.label}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-xs ${escolarCfg.color}`}>{escolarCfg.label}</td>
                  <td className="px-4 py-3">
                    {a.becaBienestar
                      ? <CheckCircle className="h-4 w-4 text-green-600" />
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {a.acompaniamiento
                      ? <span className="text-xs text-blue-600 font-medium">Activo</span>
                      : <span className="text-muted-foreground">—</span>}
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

export default SocialModule;
