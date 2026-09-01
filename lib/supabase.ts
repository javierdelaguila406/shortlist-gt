import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Tables = {
  usuarios: {
    Row: {
      id: string;
      email: string;
      nombre: string;
      rol: 'reclutador' | 'administrador';
      empresa_id: string | null;
      activo: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: Omit<Tables['usuarios']['Row'], 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Omit<Tables['usuarios']['Row'], 'id' | 'created_at'>>;
  };
  vacantes: {
    Row: {
      id: string;
      usuario_id: string;
      titulo: string;
      descripcion: string | null;
      slug: string;
      departamento: string | null;
      salario_minimo: number | null;
      salario_maximo: number | null;
      ubicacion: string | null;
      tipo_contrato: string | null;
      estado: 'activa' | 'pausada' | 'cerrada';
      criterios_minimos: any | null;
      preguntas_test: any[];
      created_at: string;
      updated_at: string;
    };
    Insert: Omit<Tables['vacantes']['Row'], 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Omit<Tables['vacantes']['Row'], 'id' | 'created_at'>>;
  };
  candidatos: {
    Row: {
      id: string;
      vacante_id: string;
      nombre: string;
      email: string | null;
      telefono: string;
      cv_url: string | null;
      cv_texto: string | null;
      score_cv: number;
      score_video: number;
      score_test: number;
      score_total: number;
      disponibilidad: string | null;
      rango_salario: string | null;
      link_linkedin: string | null;
      estado: 'pendiente' | 'en_revision' | 'aprobado' | 'rechazado' | 'oferta';
      metadata: any | null;
      created_at: string;
      updated_at: string;
    };
    Insert: Omit<Tables['candidatos']['Row'], 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Omit<Tables['candidatos']['Row'], 'id' | 'created_at'>>;
  };
  evaluaciones_whatsapp: {
    Row: {
      id: string;
      candidato_id: string;
      vacante_id: string;
      paso: number;
      estado: 'en_proceso' | 'completado' | 'abandonado';
      mensaje_confirmacion_enviado: boolean;
      respuesta_confirmacion: string | null;
      videos: any[];
      respuestas_test: any[];
      created_at: string;
      updated_at: string;
    };
    Insert: Omit<Tables['evaluaciones_whatsapp']['Row'], 'id' | 'created_at' | 'updated_at'>;
    Update: Partial<Omit<Tables['evaluaciones_whatsapp']['Row'], 'id' | 'created_at'>>;
  };
};
