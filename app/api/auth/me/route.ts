import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { user } = auth;

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.nombre || user.email,
          created_at: user.created_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SECURITY] Get user error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ error: 'Ocurrió un error' }, { status: 500 });
  }
}
