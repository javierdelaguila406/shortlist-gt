import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: vacantes, error } = await supabase
      .from('vacantes')
      .select('*')
      .eq('usuario_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] Database error (internal):', {
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: 'Error al obtener vacantes. Intenta más tarde.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ vacantes }, { status: 200 });
  } catch (error) {
    console.error('Error fetching vacantes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

