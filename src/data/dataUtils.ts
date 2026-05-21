import type { EdadFrecuencia } from '../types/Deportistas';

/**
 * Convierte edadesFrecuencia (edad + cantidad) a un array de edades individuales
 * Útil para mantener compatibilidad con buildHistogramBins
 */
export const edadesFrecuenciaToAges = (edadesFrecuencia: EdadFrecuencia[]): number[] => {
  const ages: number[] = [];
  for (const item of edadesFrecuencia) {
    for (let i = 0; i < item.cantidad; i++) {
      ages.push(item.edad);
    }
  }
  return ages;
};
