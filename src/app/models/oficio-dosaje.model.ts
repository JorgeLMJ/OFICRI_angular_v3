export interface OficioDosaje {
  id?: number;
  fecha: string;
  nro_oficio: string;
  gradoPNP: string;
  nombresyapellidosPNP: string;
  documentoId?: number;
  archivo?: Blob | File | null;

  personaInvolucrada?: string;
  dniInvolucrado?: string;
  edadInvolucrado?: string;
  tipoMuestra?: string;
  NumeroInforme?: string;
  nombre_oficio_base?: string; 
}

