// Real approximate coordinates for municipalities and club generation

export const municipioCoordinates: Record<string, { lat: number; lng: number }> = {
  // Buenos Aires (prov 1)
  'La Plata': { lat: -34.92, lng: -57.95 },
  'Mar del Plata': { lat: -38.00, lng: -57.55 },
  'Bahía Blanca': { lat: -38.72, lng: -62.27 },
  'Tandil': { lat: -37.32, lng: -59.13 },
  'Quilmes': { lat: -34.72, lng: -58.25 },
  // Córdoba (prov 2)
  'Córdoba Capital': { lat: -31.42, lng: -64.18 },
  'Villa María': { lat: -32.41, lng: -63.24 },
  'Río Cuarto': { lat: -33.13, lng: -64.35 },
  'Carlos Paz': { lat: -31.42, lng: -64.50 },
  'Alta Gracia': { lat: -31.67, lng: -64.43 },
  // Santa Fe (prov 3)
  'Rosario': { lat: -32.94, lng: -60.63 },
  'Santa Fe Capital': { lat: -31.64, lng: -60.70 },
  'Rafaela': { lat: -31.25, lng: -61.49 },
  'Venado Tuerto': { lat: -33.75, lng: -61.97 },
  'Reconquista': { lat: -29.14, lng: -59.65 },
  // Mendoza (prov 4)
  'Mendoza Capital': { lat: -32.89, lng: -68.83 },
  'San Rafael': { lat: -34.62, lng: -68.33 },
  'Godoy Cruz': { lat: -32.93, lng: -68.84 },
  'Luján de Cuyo': { lat: -33.04, lng: -68.87 },
  'Maipú': { lat: -32.98, lng: -68.78 },
  // Tucumán (prov 5)
  'San Miguel de Tucumán': { lat: -26.82, lng: -65.22 },
  'Yerba Buena': { lat: -26.82, lng: -65.32 },
  'Banda del Río Salí': { lat: -26.85, lng: -65.16 },
  'Concepción': { lat: -27.34, lng: -65.59 },
  // Entre Ríos (prov 6)
  'Paraná': { lat: -31.73, lng: -60.53 },
  'Concordia': { lat: -31.40, lng: -58.02 },
  'Gualeguaychú': { lat: -33.01, lng: -58.52 },
  'Concepción del Uruguay': { lat: -32.48, lng: -58.23 },
  // Salta (prov 7)
  'Salta Capital': { lat: -24.79, lng: -65.41 },
  'San Ramón de la Nueva Orán': { lat: -23.14, lng: -64.32 },
  'Tartagal': { lat: -22.52, lng: -63.80 },
  // Misiones (prov 8)
  'Posadas': { lat: -27.37, lng: -55.90 },
  'Oberá': { lat: -27.49, lng: -55.13 },
  'Eldorado': { lat: -26.40, lng: -54.63 },
  // Chaco (prov 9)
  'Resistencia': { lat: -27.45, lng: -59.00 },
  'Presidencia Roque Sáenz Peña': { lat: -26.79, lng: -60.44 },
  'Villa Ángela': { lat: -27.57, lng: -60.71 },
  // Corrientes (prov 10)
  'Corrientes Capital': { lat: -27.47, lng: -58.83 },
  'Goya': { lat: -29.14, lng: -59.26 },
  'Paso de los Libres': { lat: -29.72, lng: -57.08 },
  // Santiago del Estero (prov 11)
  'Santiago Capital': { lat: -27.78, lng: -64.26 },
  'La Banda': { lat: -27.73, lng: -64.24 },
  'Termas de Río Hondo': { lat: -27.49, lng: -64.86 },
  // San Juan (prov 12)
  'San Juan Capital': { lat: -31.54, lng: -68.54 },
  'Rawson': { lat: -31.53, lng: -68.50 },
  'Rivadavia': { lat: -31.53, lng: -68.60 },
  // Jujuy (prov 13)
  'San Salvador de Jujuy': { lat: -24.19, lng: -65.30 },
  'Palpalá': { lat: -24.26, lng: -65.21 },
  'San Pedro': { lat: -24.23, lng: -64.87 },
  // Río Negro (prov 14)
  'Viedma': { lat: -40.81, lng: -63.00 },
  'San Carlos de Bariloche': { lat: -41.13, lng: -71.31 },
  'General Roca': { lat: -39.03, lng: -67.08 },
  // Neuquén (prov 15)
  'Neuquén Capital': { lat: -38.95, lng: -68.06 },
  'Cipolletti': { lat: -38.94, lng: -67.99 },
  'San Martín de los Andes': { lat: -40.15, lng: -71.35 },
  // Formosa (prov 16)
  'Formosa Capital': { lat: -26.18, lng: -58.18 },
  'Clorinda': { lat: -25.29, lng: -57.72 },
  // Chubut (prov 17)
  'Rawson (Chubut)': { lat: -43.30, lng: -65.10 },
  'Comodoro Rivadavia': { lat: -45.87, lng: -67.48 },
  'Trelew': { lat: -43.25, lng: -65.31 },
  // San Luis (prov 18)
  'San Luis Capital': { lat: -33.30, lng: -66.34 },
  'Villa Mercedes': { lat: -33.68, lng: -65.47 },
  // Catamarca (prov 19)
  'San Fernando del Valle': { lat: -28.47, lng: -65.78 },
  'Andalgalá': { lat: -27.60, lng: -66.31 },
  // La Rioja (prov 20)
  'La Rioja Capital': { lat: -29.41, lng: -66.85 },
  'Chilecito': { lat: -29.16, lng: -67.50 },
  // La Pampa (prov 21)
  'Santa Rosa': { lat: -36.62, lng: -64.29 },
  'General Pico': { lat: -35.66, lng: -63.76 },
  // Santa Cruz (prov 22)
  'Río Gallegos': { lat: -51.62, lng: -69.22 },
  'Caleta Olivia': { lat: -46.44, lng: -67.52 },
  // Tierra del Fuego (prov 23)
  'Ushuaia': { lat: -54.80, lng: -68.30 },
  'Río Grande': { lat: -53.79, lng: -67.70 },
  // CABA (prov 24)
  'CABA Centro': { lat: -34.60, lng: -58.38 },
  'CABA Norte': { lat: -34.56, lng: -58.45 },
  'CABA Sur': { lat: -34.65, lng: -58.43 },
};

// Generate a random offset for club location around municipality center
const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

const rand = seededRandom(123);

export const generateClubCoords = (munName: string, _index: number): { lat: number; lng: number } => {
  const center = municipioCoordinates[munName];
  if (!center) {
    return { lat: -34.6 + rand() * 0.1, lng: -58.4 + rand() * 0.1 };
  }
  // Spread clubs around municipality center within ~0.05 degrees (~5km)
  const latOffset = (rand() - 0.5) * 0.08;
  const lngOffset = (rand() - 0.5) * 0.08;
  return {
    lat: center.lat + latOffset,
    lng: center.lng + lngOffset,
  };
};
