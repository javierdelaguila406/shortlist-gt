import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import { persistentRateLimit } from '@/lib/rate-limit';
import { calculateCVScore } from '@/lib/cv-score';
import { requireUser } from '@/lib/supabase-server';
import { getOwnedCandidato } from '@/lib/authz';

const MAX_PDF_SIZE = 10 * 1024 * 1024;

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    return (await parser.getText()).text || '';
  } finally {
    await parser.destroy();
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { supabase, user } = auth;
  if (!(await persistentRateLimit(`cv-analysis:${user.id}`, 10, 86400000)).success) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
  }

  const formData = await request.formData();
  const pdf = formData.get('pdf');
  const candidateId = formData.get('candidato_id');
  if (!(pdf instanceof File)) return NextResponse.json({ error: 'PDF file required' }, { status: 400 });
  if (pdf.type !== 'application/pdf') return NextResponse.json({ error: 'File must be PDF' }, { status: 400 });
  if (pdf.size > MAX_PDF_SIZE) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 });

  const bytes = Buffer.from(await pdf.arrayBuffer());
  if (bytes.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return NextResponse.json({ error: 'File must be PDF' }, { status: 400 });
  }

  if (typeof candidateId === 'string' && candidateId) {
    const owned = await getOwnedCandidato(supabase, user.id, candidateId);
    if (!owned.ok) return NextResponse.json({ error: 'Forbidden' }, { status: owned.status });
  }

  try {
    const extractedText = (await extractPdfText(bytes)).trim();
    const evaluated = extractedText.length > 0;
    const score = evaluated ? calculateCVScore(extractedText) : { total: 0, keywords: 0, experience: 0 };
    const { error: insertError } = await supabase.from('cv_analysis').insert({
      usuario_id: user.id,
      candidato_id: typeof candidateId === 'string' && candidateId ? candidateId : null,
      pdf_filename: pdf.name,
      text_extracted: extractedText.slice(0, 5000),
      score_total: score.total,
      score_keywords: score.keywords,
      score_experience: score.experience,
      evaluated,
      analyzed_at: new Date().toISOString(),
    });
    if (insertError) throw insertError;

    console.log('[Document analysis] Processed successfully');
    return NextResponse.json({ score_total: score.total, score_keywords: score.keywords, score_experience: score.experience, evaluated });
  } catch {
    console.error('[Document analysis] Processing failed');
    return NextResponse.json({ error: 'Failed to analyze document', evaluated: false }, { status: 500 });
  }
}
