export interface DeportistasTotalesResponse {
  deportistas: number;
  deportes: number;
  provinciaLider: string;
  porcentaje: number;
  deporteLider: string;
  cantidadDeportistas: number;
}

export interface EdadFrecuencia {
  edad: number;
  cantidad: number;
}

export interface EdadesHistogramaResponse {
  edadesFrecuencia: EdadFrecuencia[];
}