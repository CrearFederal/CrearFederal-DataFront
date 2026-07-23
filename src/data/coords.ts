export const toNumber = (value: string | number): number => {
  if (typeof value === "number") return value;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// La DB usa -9999999999.99 como "sin dato" en polideportivo_comunitario.
// Es varios órdenes de magnitud más grande que cualquier coordenada real
// (aun escalada ×10^N), así que un umbral alto la distingue sin falsos positivos.
const SENTINEL_THRESHOLD = 5_000_000_000;

// Coordenadas pueden venir como enteros escalados (×10^N). Divide por 10
// iterativamente hasta quedar dentro del rango válido (±90 lat, ±180 lng).
export const normalizeCoord = (value: number, max: number): number => {
  let v = value;
  while (Math.abs(v) > max) v /= 10;
  return v;
};

// Igual que normalizeCoord, pero devuelve null para el sentinel de "sin dato"
// en vez de normalizarlo a un número dentro de rango pero geográficamente falso.
export const normalizeCoordOrNull = (value: number, max: number): number | null => {
  if (Math.abs(value) >= SENTINEL_THRESHOLD) return null;
  return normalizeCoord(value, max);
};
