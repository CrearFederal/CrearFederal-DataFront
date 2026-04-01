// Re-export real GeoJSON data and provide province centers
export { argentinaProvinces } from './argentinaGeoData';
export type { ProvinceFeatureProperties } from './argentinaGeoData';

// Province centers for zoom targets
export const provinceCenters: Record<number, { lat: number; lng: number; zoom: number }> = {
  1: { lat: -36.6, lng: -59.9, zoom: 7 },    // Buenos Aires
  2: { lat: -31.4, lng: -64.2, zoom: 7 },    // Córdoba
  3: { lat: -31.0, lng: -60.7, zoom: 7 },    // Santa Fe
  4: { lat: -34.0, lng: -69.0, zoom: 7 },    // Mendoza
  5: { lat: -26.8, lng: -65.2, zoom: 8 },    // Tucumán
  6: { lat: -31.7, lng: -59.0, zoom: 8 },    // Entre Ríos
  7: { lat: -24.5, lng: -65.4, zoom: 7 },    // Salta
  8: { lat: -27.0, lng: -54.5, zoom: 8 },    // Misiones
  9: { lat: -27.0, lng: -60.0, zoom: 7 },    // Chaco
  10: { lat: -28.5, lng: -57.8, zoom: 7 },   // Corrientes
  11: { lat: -28.0, lng: -64.0, zoom: 7 },   // Santiago del Estero
  12: { lat: -31.0, lng: -69.0, zoom: 7 },   // San Juan
  13: { lat: -23.3, lng: -65.7, zoom: 8 },   // Jujuy
  14: { lat: -40.0, lng: -67.5, zoom: 7 },   // Río Negro
  15: { lat: -38.5, lng: -70.0, zoom: 7 },   // Neuquén
  16: { lat: -24.5, lng: -59.5, zoom: 7 },   // Formosa
  17: { lat: -44.0, lng: -68.5, zoom: 6 },   // Chubut
  18: { lat: -33.5, lng: -66.3, zoom: 7 },   // San Luis
  19: { lat: -28.0, lng: -66.5, zoom: 7 },   // Catamarca
  20: { lat: -29.4, lng: -67.5, zoom: 7 },   // La Rioja
  21: { lat: -37.0, lng: -65.5, zoom: 7 },   // La Pampa
  22: { lat: -49.0, lng: -69.0, zoom: 6 },   // Santa Cruz
  23: { lat: -54.0, lng: -69.0, zoom: 7 },   // Tierra del Fuego
  24: { lat: -34.61, lng: -58.45, zoom: 12 }, // CABA
};

// Municipality approximate centers
export const municipioCenters: Record<number, { lat: number; lng: number }> = {};
