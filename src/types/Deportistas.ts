export interface DeportistasTotalesResponse {
  deportistas: number;
  deportes: number;
  provinciaLider: string;
  porcentaje: number;
  provinciaLider2?: string;
  porcentaje2?: number;
  provinciaLider3?: string;
  porcentaje3?: number;
  deporteLider: string;
  cantidadDeportistas: number;
}

export interface DeportistasGenerosResponse {
  masculino: number;
  femenino: number;
  porcentajeM: number;
  porcentajeF: number;
  edadPromedioM: number;
  edadPromedioF: number;
  deporteLiderM: string;
  deporteLiderF: string;
}

export interface EdadFrecuencia {
  edad: number;
  cantidad: number;
}

export interface EdadesHistogramaResponse {
  edadesFrecuencia: EdadFrecuencia[];
}