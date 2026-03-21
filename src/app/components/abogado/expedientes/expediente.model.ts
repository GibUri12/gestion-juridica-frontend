export interface Expediente {
  id: number;
  numeroExpediente: string;
  sufijoExpediente?: string;
  cliente: { id: number; nombreCompleto: string };
  empresa: { id: number; nombreCompleto: string };
  junta?: { id: number; nombre: string }; // Ajustar según tu CatJunta
  tribunal?: { id: number; nombre: string };
  litis?: string;
  amparo?: string;
  anotacion?: string;
  estado: 'ACTIVO' | 'EN_PROCESO' | 'FINALIZADO';
  fechaRecordatorio?: string;
  proximaAudiencia?: string;
  
}