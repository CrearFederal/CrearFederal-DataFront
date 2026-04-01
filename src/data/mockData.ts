import type { Provincia, Municipio, Club, Deportista, Deporte, PerfilDeportivo } from '../types/types';
import { generateClubCoords } from './coordinates';

export const provincias: Provincia[] = [
  { id_provincia: 1, nombre: 'Buenos Aires' },
  { id_provincia: 2, nombre: 'Córdoba' },
  { id_provincia: 3, nombre: 'Santa Fe' },
  { id_provincia: 4, nombre: 'Mendoza' },
  { id_provincia: 5, nombre: 'Tucumán' },
  { id_provincia: 6, nombre: 'Entre Ríos' },
  { id_provincia: 7, nombre: 'Salta' },
  { id_provincia: 8, nombre: 'Misiones' },
  { id_provincia: 9, nombre: 'Chaco' },
  { id_provincia: 10, nombre: 'Corrientes' },
  { id_provincia: 11, nombre: 'Santiago del Estero' },
  { id_provincia: 12, nombre: 'San Juan' },
  { id_provincia: 13, nombre: 'Jujuy' },
  { id_provincia: 14, nombre: 'Río Negro' },
  { id_provincia: 15, nombre: 'Neuquén' },
  { id_provincia: 16, nombre: 'Formosa' },
  { id_provincia: 17, nombre: 'Chubut' },
  { id_provincia: 18, nombre: 'San Luis' },
  { id_provincia: 19, nombre: 'Catamarca' },
  { id_provincia: 20, nombre: 'La Rioja' },
  { id_provincia: 21, nombre: 'La Pampa' },
  { id_provincia: 22, nombre: 'Santa Cruz' },
  { id_provincia: 23, nombre: 'Tierra del Fuego' },
  { id_provincia: 24, nombre: 'CABA' },
];

const municipioNames: Record<number, string[]> = {
  1: ['La Plata', 'Mar del Plata', 'Bahía Blanca', 'Tandil', 'Quilmes'],
  2: ['Córdoba Capital', 'Villa María', 'Río Cuarto', 'Carlos Paz', 'Alta Gracia'],
  3: ['Rosario', 'Santa Fe Capital', 'Rafaela', 'Venado Tuerto', 'Reconquista'],
  4: ['Mendoza Capital', 'San Rafael', 'Godoy Cruz', 'Luján de Cuyo', 'Maipú'],
  5: ['San Miguel de Tucumán', 'Yerba Buena', 'Banda del Río Salí', 'Concepción'],
  6: ['Paraná', 'Concordia', 'Gualeguaychú', 'Concepción del Uruguay'],
  7: ['Salta Capital', 'San Ramón de la Nueva Orán', 'Tartagal'],
  8: ['Posadas', 'Oberá', 'Eldorado'],
  9: ['Resistencia', 'Presidencia Roque Sáenz Peña', 'Villa Ángela'],
  10: ['Corrientes Capital', 'Goya', 'Paso de los Libres'],
  11: ['Santiago Capital', 'La Banda', 'Termas de Río Hondo'],
  12: ['San Juan Capital', 'Rawson', 'Rivadavia'],
  13: ['San Salvador de Jujuy', 'Palpalá', 'San Pedro'],
  14: ['Viedma', 'San Carlos de Bariloche', 'General Roca'],
  15: ['Neuquén Capital', 'Cipolletti', 'San Martín de los Andes'],
  16: ['Formosa Capital', 'Clorinda'],
  17: ['Rawson', 'Comodoro Rivadavia', 'Trelew'],
  18: ['San Luis Capital', 'Villa Mercedes'],
  19: ['San Fernando del Valle', 'Andalgalá'],
  20: ['La Rioja Capital', 'Chilecito'],
  21: ['Santa Rosa', 'General Pico'],
  22: ['Río Gallegos', 'Caleta Olivia'],
  23: ['Ushuaia', 'Río Grande'],
  24: ['CABA Centro', 'CABA Norte', 'CABA Sur'],
};

let munId = 1;
export const municipios: Municipio[] = [];
for (const [provId, names] of Object.entries(municipioNames)) {
  for (const nombre of names) {
    municipios.push({ id_municipio: munId++, nombre, id_provincia: Number(provId) });
  }
}

export const deportes: Deporte[] = [
  { id_deporte: 1, nombre: 'Fútbol' },
  { id_deporte: 2, nombre: 'Básquetbol' },
  { id_deporte: 3, nombre: 'Vóleibol' },
  { id_deporte: 4, nombre: 'Tenis' },
  { id_deporte: 5, nombre: 'Natación' },
  { id_deporte: 6, nombre: 'Atletismo' },
  { id_deporte: 7, nombre: 'Hockey' },
  { id_deporte: 8, nombre: 'Rugby' },
];

const clubPrefixes = ['Club Atlético', 'Club Deportivo', 'Club Social y Deportivo', 'Asociación Deportiva', 'Centro Deportivo'];
const clubSuffixes = ['Unidos', 'Juventud', 'Progreso', 'Independiente', 'San Martín', 'Rivadavia', 'Belgrano', 'Central', 'Norte', 'Sur'];

const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

const rand = seededRandom(42);

export const clubes: Club[] = [];
let clubId = 1;
for (const mun of municipios) {
  const numClubs = Math.floor(rand() * 5) + 2;
  for (let i = 0; i < numClubs; i++) {
    const coords = generateClubCoords(mun.nombre, clubId);
    const currentClubId = clubId++;
    clubes.push({
      id_club: currentClubId,
      nombre: `${clubPrefixes[Math.floor(rand() * clubPrefixes.length)]} ${clubSuffixes[Math.floor(rand() * clubSuffixes.length)]}`,
      id_provincia: mun.id_provincia,
      id_municipio: mun.id_municipio,
      direccion: `Calle ${Math.floor(rand() * 9000 + 1000)}`,
      lat: coords.lat,
      lng: coords.lng,
      logoUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=club${currentClubId}&size=64`,
    });
  }
}

export const deportistas: Deportista[] = [];
let depId = 1;
for (const club of clubes) {
  const numAthletes = Math.floor(rand() * 20) + 5;
  for (let i = 0; i < numAthletes; i++) {
    const year = 1985 + Math.floor(rand() * 30);
    const month = Math.floor(rand() * 12) + 1;
    const day = Math.floor(rand() * 28) + 1;
    deportistas.push({
      id_deportista: depId++,
      sexo: rand() > 0.45 ? 'M' : 'F',
      fecha_nac: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      id_provincia: club.id_provincia,
      id_municipio: club.id_municipio,
    });
  }
}

export const perfilesDeportivos: PerfilDeportivo[] = [];
for (const dep of deportistas) {
  const club = clubes.find(c => c.id_provincia === dep.id_provincia && c.id_municipio === dep.id_municipio);
  if (!club) continue;
  const numSports = Math.floor(rand() * 2) + 1;
  const usedSports = new Set<number>();
  for (let i = 0; i < numSports; i++) {
    const sportId = Math.floor(rand() * deportes.length) + 1;
    if (usedSports.has(sportId)) continue;
    usedSports.add(sportId);
    perfilesDeportivos.push({
      id_deportista: dep.id_deportista,
      id_deporte: sportId,
      id_club: club.id_club,
    });
  }
}
