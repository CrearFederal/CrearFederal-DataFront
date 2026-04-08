import { useMemo } from 'react';
import { Calendar, MapPin, Users, ChevronRight } from 'lucide-react';
import { provincias } from '../data/mockData';

// ---------------- MOCK DATA ----------------

function seededRand(seed: number) {
  return ((seed * 9301 + 49297) % 233280) / 233280;
}

type EventoTipo = 'jadar' | 'juegos' | 'federativo' | 'capacitacion';
type EventoEstado = 'proximo' | 'en_curso' | 'finalizado';

const TIPO_CONFIG: Record<EventoTipo, { label: string; color: string; bg: string }> = {
  jadar:       { label: 'JADAR',        color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  juegos:      { label: 'Juegos CReAR', color: 'text-primary',    bg: 'bg-primary/10 border-primary/20' },
  federativo:  { label: 'Federativo',   color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  capacitacion:{ label: 'Capacitación', color: 'text-teal-700',   bg: 'bg-teal-50 border-teal-200' },
};

const ESTADO_CONFIG: Record<EventoEstado, { label: string; color: string }> = {
  proximo:    { label: 'Próximo',    color: 'text-blue-600' },
  en_curso:   { label: 'En curso',  color: 'text-green-600' },
  finalizado: { label: 'Finalizado', color: 'text-muted-foreground' },
};

const EVENTO_NOMBRES: Record<EventoTipo, string[]> = {
  jadar:       ['JADAR Zona Norte', 'JADAR Zona Centro', 'JADAR Zona Sur', 'JADAR Litoral'],
  juegos:      ['Juegos CReAR Federal', 'Juegos CReAR Patagonia', 'Juegos CReAR NOA'],
  federativo:  ['Copa Federal de Fútbol', 'Torneo Nacional de Básquetbol', 'Campeonato de Natación', 'Open de Tenis'],
  capacitacion:['Actualización Entrenadores', 'Seminario Detección de Talento', 'Foro Inclusión Deportiva'],
};

function mockEventos() {
  const tipos: EventoTipo[] = ['jadar', 'jadar', 'juegos', 'federativo', 'federativo', 'federativo', 'capacitacion', 'juegos', 'jadar', 'federativo', 'capacitacion', 'jadar'];
  const meses = ['2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-02'];

  return tipos.map((tipo, i) => {
    const r1 = seededRand(i * 17 + 5);
    const r2 = seededRand(i * 11 + 3);
    const nombres = EVENTO_NOMBRES[tipo];
    const nombre = nombres[Math.floor(r1 * nombres.length)];
    const provincia = provincias[Math.floor(r2 * provincias.length)];
    const participantes = Math.floor(100 + seededRand(i * 7) * 900);
    const estado: EventoEstado = i < 3 ? 'finalizado' : i < 5 ? 'en_curso' : 'proximo';
    const dia = String(Math.floor(seededRand(i * 3) * 25) + 1).padStart(2, '0');
    return { id: i + 1, nombre, tipo, provincia: provincia.nombre, fecha: `${meses[i]}-${dia}`, participantes, estado };
  });
}

// ---------------- COMPONENT ----------------

function EventosModule() {
  const eventos = useMemo(() => mockEventos(), []);

  const summary = useMemo(() => ({
    proximos:   eventos.filter((e) => e.estado === 'proximo').length,
    en_curso:   eventos.filter((e) => e.estado === 'en_curso').length,
    finalizados: eventos.filter((e) => e.estado === 'finalizado').length,
    jadar:      eventos.filter((e) => e.tipo === 'jadar').length,
  }), [eventos]);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Calendar className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Ciclo de Eventos</h2>
          <p className="text-xs text-muted-foreground">
            JADAR, Juegos CReAR y eventos federales — {eventos.length} eventos en el ciclo
          </p>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5">
          <span className="text-sm font-semibold text-green-700">{summary.en_curso}</span>
          <span className="text-xs text-muted-foreground">En curso</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5">
          <span className="text-sm font-semibold text-blue-600">{summary.proximos}</span>
          <span className="text-xs text-muted-foreground">Próximos</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5">
          <span className="text-sm font-semibold text-orange-700">{summary.jadar}</span>
          <span className="text-xs text-muted-foreground">JADAR</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5">
          <span className="text-sm font-semibold text-muted-foreground">{summary.finalizados}</span>
          <span className="text-xs text-muted-foreground">Finalizados</span>
        </div>
      </div>

      {/* Events list */}
      <div className="flex flex-col gap-2">
        {eventos.map((ev) => {
          const tipoCfg = TIPO_CONFIG[ev.tipo];
          const estadoCfg = ESTADO_CONFIG[ev.estado];
          return (
            <div
              key={ev.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-secondary/30"
            >
              {/* Tipo badge */}
              <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tipoCfg.bg} ${tipoCfg.color}`}>
                {tipoCfg.label}
              </span>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{ev.nombre}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {ev.provincia}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {ev.participantes.toLocaleString('es-AR')} participantes
                  </span>
                </div>
              </div>

              {/* Date */}
              <span className="text-xs text-muted-foreground shrink-0">{ev.fecha}</span>

              {/* Estado */}
              <span className={`text-xs font-medium shrink-0 ${estadoCfg.color}`}>{estadoCfg.label}</span>

              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EventosModule;
