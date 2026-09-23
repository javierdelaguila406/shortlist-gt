import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

export function getRequestToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length) || null;
  return request.cookies.get('sb-auth-token')?.value || null;
}

export function createAnonClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    clientOptions
  );
}

export function createUserClient(token: string): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { ...clientOptions, global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function requireUser(
  request: NextRequest
): Promise<{ user: User; supabase: SupabaseClient; token: string } | null> {
  const token = getRequestToken(request);
  if (!token) return null;
  const supabase = createUserClient(token);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { user: data.user, supabase, token };
}
