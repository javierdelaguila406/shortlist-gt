import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized', plan: 'demo' }, { status: 401 });
    }

    const { data: company, error: queryError } = await auth.supabase
      .from('companies')
      .select('plan, license_code_used')
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (queryError || !company) {
      return NextResponse.json({ plan: 'demo', user_id: auth.user.id });
    }

    return NextResponse.json({
      plan: company.plan || 'demo',
      license_code_used: company.license_code_used,
      user_id: auth.user.id,
    });
  } catch (error) {
    console.error('[API] Error checking plan:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ error: 'Server error', plan: 'demo' }, { status: 500 });
  }
}
