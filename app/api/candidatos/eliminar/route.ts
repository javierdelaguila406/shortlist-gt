import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function DELETE(request: NextRequest) {
  try {
    const { id, telefono, verificacion_token } = await request.json();

    if (!id && !telefono) {
      return NextResponse.json(
        { error: 'Se requiere ID o número de teléfono' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRole);

    let candidatoId: string | null = null;
    let nombreCandidato: string | null = null;

    // Buscar candidato por ID o teléfono
    if (id) {
      const { data, error } = await supabase
        .from('candidatos')
        .select('id, nombre, email')
        .eq('id', id)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Candidato no encontrado' },
          { status: 404 }
        );
      }

      candidatoId = data.id;
      nombreCandidato = data.nombre;
    } else if (telefono) {
      const { data, error } = await supabase
        .from('candidatos')
        .select('id, nombre, email')
        .eq('telefono', telefono)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'Candidato no encontrado' },
          { status: 404 }
        );
      }

      candidatoId = data.id;
      nombreCandidato = data.nombre;
    }

    if (!candidatoId) {
      return NextResponse.json(
        { error: 'No se pudo identificar al candidato' },
        { status: 400 }
      );
    }

    // Iniciar transacción de eliminación en cascada
    const { data: candidatoData } = await supabase
      .from('candidatos')
      .select('cv_url, video_urls')
      .eq('id', candidatoId)
      .single();

    // Eliminar archivos de Supabase Storage si existen
    if (candidatoData?.cv_url) {
      try {
        const fileName = candidatoData.cv_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('candidatos-cvs')
            .remove([fileName]);
        }
      } catch (error) {
        console.error('Error eliminando CV:', error);
      }
    }

    if (candidatoData?.video_urls && Array.isArray(candidatoData.video_urls)) {
      try {
        for (const videoUrl of candidatoData.video_urls) {
          const fileName = videoUrl.split('/').pop();
          if (fileName) {
            await supabase.storage
              .from('candidatos-videos')
              .remove([fileName]);
          }
        }
      } catch (error) {
        console.error('Error eliminando videos:', error);
      }
    }

    // Eliminar evaluaciones relacionadas
    await supabase
      .from('candidatos')
      .delete()
      .eq('id', candidatoId);

    // Log de eliminación para auditoría
    await supabase
      .from('logs_privacidad')
      .insert({
        accion: 'DERECHO_AL_OLVIDO',
        candidato_id: candidatoId,
        candidato_nombre: nombreCandidato,
        timestamp: new Date().toISOString(),
        ip_origen: request.headers.get('x-forwarded-for') || 'unknown',
        motivo: 'Solicitud de eliminación de datos (Derecho al Olvido)',
      });

    return NextResponse.json(
      {
        success: true,
        mensaje: `Los datos de ${nombreCandidato} han sido eliminados permanentemente`,
        candidato_id: candidatoId,
        timestamp_eliminacion: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en eliminación de datos:', error);
    return NextResponse.json(
      { error: 'Error al procesar solicitud de eliminación' },
      { status: 500 }
    );
  }
}
