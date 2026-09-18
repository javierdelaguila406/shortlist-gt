import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', plan: 'demo' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuration error', plan: 'demo' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token', plan: 'demo' },
        { status: 401 }
      );
    }

    // Obtener plan del usuario
    const { data: company, error: queryError } = await supabase
      .from('companies')
      .select('plan, license_code_used')
      .eq('user_id', user.id)
      .single();

    if (queryError || !company) {
      // Valor por defecto: demo
      return NextResponse.json({
        plan: 'demo',
        user_id: user.id,
      });
    }

    return NextResponse.json({
      plan: company.plan || 'demo',
      license_code_used: company.license_code_used,
      user_id: user.id,
    });

  } catch (error) {
    console.error('[API] Error checking plan:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: 'Server error', plan: 'demo' },
      { status: 500 }
    );
  }
}
