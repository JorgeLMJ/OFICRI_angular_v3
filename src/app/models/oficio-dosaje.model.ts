export interface OficioDosaje {
  id?: number;
  fecha: string;
  nro_oficio: string;
  gradoPNP: string;
  nombresyapellidosPNP: string;
  referencia: string;
  nro_informe: string;
  documentoId?: number;
  empleadoId?: number; 
  archivo?: Blob | File | null; 
}

