import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  console.log('[Debug] Verifying authentication');

  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    console.log('❌ NO HAY HEADER AUTHORIZATION');
    return NextResponse.json({ error: 'No authorization header' }, { status: 400 });
  }

  console.log('✅ Header Authorization presente');

  if (!authHeader.startsWith('Bearer ')) {
    console.log('❌ Header no tiene formato Bearer');
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  }

  const token = authHeader.substring(7);
  console.log('[Debug] Credential extracted');

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError) {
    console.log('[Debug] Authentication verification failed');
    return NextResponse.json({ error: authError.message }, { status: 401 });
  }

  if (!user) {
    console.log('[Debug] Valid credential without user');
    return NextResponse.json({ error: 'No user found' }, { status: 401 });
  }

  console.log('✅ Usuario encontrado:', user.id);
  console.log('[Debug] User authenticated', { userId: user.id });

  // Verificar si existe en companies
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id);

  console.log('📋 En tabla companies:', companies && companies.length > 0 ? 'SÍ' : 'NO');

  return NextResponse.json({
    success: true,
    user_id: user.id,
    email: user.email,
    inCompanies: companies && companies.length > 0,
    companyData: companies && companies[0],
  });
}
