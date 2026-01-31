export interface OficioToxicologia {
  id?: number;
  fecha: string;
  nro_oficio: string;
  gradoPNP: string;
  nombresyapellidosPNP: string;
  documentoId?: number;
  nro_informe_referencia: string; 
  archivo?: Blob | File | null;

  personaInvolucrada?: string;
  dniInvolucrado?: string;
  edadInvolucrado?: string;
  tipoMuestra?: string;
  NumeroInforme?: string;
  
}

