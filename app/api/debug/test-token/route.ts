import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  console.log('\n🧪 TEST ENDPOINT - Verificando token y usuario\n');

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
  console.log('✅ Token extraído:', token.substring(0, 20) + '...');

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError) {
    console.log('❌ Error al verificar token:', authError.message);
    return NextResponse.json({ error: authError.message }, { status: 401 });
  }

  if (!user) {
    console.log('❌ Token válido pero no hay usuario');
    return NextResponse.json({ error: 'No user found' }, { status: 401 });
  }

  console.log('✅ Usuario encontrado:', user.id);
  console.log('✅ Email:', user.email);

  // Verificar si existe en companies
  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id);

  console.log('📋 En tabla companies:', company?.length > 0 ? 'SÍ' : 'NO');

  return NextResponse.json({
    success: true,
    user_id: user.id,
    email: user.email,
    inCompanies: company && company.length > 0,
    companyData: company && company[0],
  });
}
