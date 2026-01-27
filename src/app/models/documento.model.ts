export interface Documento {
  id?: number;
  nombresyapellidos: string;
  dni: string;
  edad: string;
  cualitativo?: string; // Puede ser nulo
  cuantitativo?: string;
  nombreDocumento?: string;
  nombreOficio?: string;
  procedencia?: string;
  tipoMuestra?: string;
  personaQueConduce?: string;
  
  // Relaciones
  empleadoId?: number; // Importante para asignar el empleado

  // El archivo no se suele manejar en el JSON estándar al listar, 
  // pero si lo necesitas para alguna lógica específica:
  archivo?: Blob | File | null; 
  
}