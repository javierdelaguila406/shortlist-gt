import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { cvObjectPath, getOwnedCandidato, ownershipError } from '@/lib/authz';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const owned = await getOwnedCandidato(auth.supabase, auth.user.id, id);
    if (!owned.ok) {
      const { body, init } = ownershipError(owned);
      return NextResponse.json(body, init);
    }

    const cvPath = cvObjectPath(owned.data.cv_url);
    if (!cvPath) return NextResponse.json({ error: 'CV no disponible' }, { status: 404 });

    const { data, error } = await createAdminClient().storage
      .from('cvs')
      .createSignedUrl(cvPath, 60, { download: true });

    if (error || !data) {
      console.error('[CV] Signed URL failed', { candidatoId: id });
      return NextResponse.json({ error: 'CV no disponible' }, { status: 500 });
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (error) {
    console.error('[CV] Error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
