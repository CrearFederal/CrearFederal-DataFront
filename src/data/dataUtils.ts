import type { Filters } from '../types/types';
import { provincias, municipios, clubes, deportistas, deportes, perfilesDeportivos } from './mockData';

const getAge = (fechaNac: string): number => {
  const birth = new Date(fechaNac);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
};

const getFilteredAthleteIds = (filters: Filters, scope?: { provinciaId?: number; municipioId?: number; clubId?: number }): Set<number> => {
  let filteredPerfiles = [...perfilesDeportivos];

  // Filter by sport
  if (filters.sports.length > 0) {
    filteredPerfiles = filteredPerfiles.filter(p => filters.sports.includes(p.id_deporte));
  }

  // Filter by club scope
  if (scope?.clubId) {
    filteredPerfiles = filteredPerfiles.filter(p => p.id_club === scope.clubId);
  }

  const athleteIds = new Set(filteredPerfiles.map(p => p.id_deportista));

  // Now filter deportistas by gender, age, geography
  const filtered = deportistas.filter(d => {
    if (!athleteIds.has(d.id_deportista)) return false;
    if (filters.gender.length > 0 && !filters.gender.includes(d.sexo)) return false;
    const age = getAge(d.fecha_nac);
    if (age < filters.ageRange[0] || age > filters.ageRange[1]) return false;
    if (scope?.provinciaId && d.id_provincia !== scope.provinciaId) return false;
    if (scope?.municipioId && d.id_municipio !== scope.municipioId) return false;
    return true;
  });

  return new Set(filtered.map(d => d.id_deportista));
};

export const getProvincias = () => provincias;
export const getMunicipios = (provinciaId?: number) =>
  provinciaId ? municipios.filter(m => m.id_provincia === provinciaId) : municipios;
export const getClubes = (scope?: { provinciaId?: number; municipioId?: number }) => {
  let result = clubes;
  if (scope?.provinciaId) result = result.filter(c => c.id_provincia === scope.provinciaId);
  if (scope?.municipioId) result = result.filter(c => c.id_municipio === scope.municipioId);
  return result;
};
export const getClub = (clubId: number) => clubes.find(c => c.id_club === clubId);
export const getDeportes = () => deportes;
export const getProvincia = (id: number) => provincias.find(p => p.id_provincia === id);
export const getMunicipio = (id: number) => municipios.find(m => m.id_municipio === id);

export const getStats = (filters: Filters, scope?: { provinciaId?: number; municipioId?: number; clubId?: number }) => {
  const athleteIds = getFilteredAthleteIds(filters, scope);
  const athletes = deportistas.filter(d => athleteIds.has(d.id_deportista));

  // Athletes per sport
  const sportCounts: Record<number, number> = {};
  const relevantPerfiles = perfilesDeportivos.filter(p => athleteIds.has(p.id_deportista));
  for (const p of relevantPerfiles) {
    sportCounts[p.id_deporte] = (sportCounts[p.id_deporte] || 0) + 1;
  }
  const athletesPerSport = deportes.map(d => ({
    sport: d.nombre,
    count: sportCounts[d.id_deporte] || 0,
  })).filter(s => s.count > 0).sort((a, b) => b.count - a.count);

  // Gender distribution
  const male = athletes.filter(a => a.sexo === 'M').length;
  const female = athletes.filter(a => a.sexo === 'F').length;
  const total = male + female;
  const genderDistribution = {
    male,
    female,
    malePercent: total > 0 ? Math.round((male / total) * 100) : 0,
    femalePercent: total > 0 ? Math.round((female / total) * 100) : 0,
  };

  // Gender per sport
  const genderPerSport = deportes.map(d => {
    const sportAthletes = relevantPerfiles.filter(p => p.id_deporte === d.id_deporte).map(p => p.id_deportista);
    const m = deportistas.filter(a => sportAthletes.includes(a.id_deportista) && a.sexo === 'M').length;
    const f = deportistas.filter(a => sportAthletes.includes(a.id_deportista) && a.sexo === 'F').length;
    const t = m + f;
    return {
      sport: d.nombre,
      male: m,
      female: f,
      malePercent: t > 0 ? Math.round((m / t) * 100) : 0,
      femalePercent: t > 0 ? Math.round((f / t) * 100) : 0,
    };
  }).filter(s => s.male + s.female > 0);

  // Age distribution
  const ageBuckets: Record<string, number> = { '< 15': 0, '15-20': 0, '21-25': 0, '26-30': 0, '31-35': 0, '36-40': 0, '40+': 0 };
  let ageSum = 0;
  for (const a of athletes) {
    const age = getAge(a.fecha_nac);
    ageSum += age;
    if (age < 15) ageBuckets['< 15']++;
    else if (age <= 20) ageBuckets['15-20']++;
    else if (age <= 25) ageBuckets['21-25']++;
    else if (age <= 30) ageBuckets['26-30']++;
    else if (age <= 35) ageBuckets['31-35']++;
    else if (age <= 40) ageBuckets['36-40']++;
    else ageBuckets['40+']++;
  }
  const ageDistribution = Object.entries(ageBuckets).map(([range, count]) => ({ range, count }));
  const averageAge = athletes.length > 0 ? Math.round((ageSum / athletes.length) * 10) / 10 : 0;

  // Clubs in scope
  const scopedClubs = getClubes(scope);
  const relevantClubIds = new Set(relevantPerfiles.map(p => p.id_club));
  const filteredClubs = scopedClubs.filter(c => relevantClubIds.has(c.id_club));

  // Most practiced sport
  const mostPracticed = athletesPerSport[0]?.sport || 'N/A';
  const mostPracticedCount = athletesPerSport[0]?.count || 0;

  // Club with most athletes
  const clubAthleteCount: Record<number, number> = {};
  for (const p of relevantPerfiles) {
    clubAthleteCount[p.id_club] = (clubAthleteCount[p.id_club] || 0) + 1;
  }
  const clubWithMostAthletes = filteredClubs.length > 0
    ? filteredClubs.reduce((maxClub, club) => {
        const count = clubAthleteCount[club.id_club] || 0;
        const maxCount = clubAthleteCount[maxClub.id_club] || 0;
        return count > maxCount ? club : maxClub;
      })
    : null;

  // Unique sports count
  const uniqueSports = new Set(relevantPerfiles.map(p => p.id_deporte)).size;

  return {
    totalAthletes: athletes.length,
    totalClubs: filteredClubs.length,
    totalSports: uniqueSports,
    mostPracticedSport: mostPracticed,
    mostPracticedCount,
    clubWithMostAthletes: clubWithMostAthletes?.nombre ?? 'N/A',
    clubWithMostAthletesCount: clubWithMostAthletes ? (clubAthleteCount[clubWithMostAthletes.id_club] || 0) : 0,
    athletesPerSport,
    genderDistribution,
    genderPerSport,
    ageDistribution,
    averageAge,
  };
};

export const getProvinciaStats = (filters: Filters) => {
  return provincias.map(p => {
    const stats = getStats(filters, { provinciaId: p.id_provincia });
    return {
      ...p,
      totalClubs: stats.totalClubs,
      totalAthletes: stats.totalAthletes,
    };
  });
};
