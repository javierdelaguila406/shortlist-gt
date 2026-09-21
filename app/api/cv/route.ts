import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PDFParse } from 'pdf-parse';
import { persistentRateLimit } from '@/lib/rate-limit';

const MAX_PDF_SIZE = 10 * 1024 * 1024;

export function calculateCVScore(text: string) {
  const normalized = text.toLocaleLowerCase('es');
  const skills = ['typescript', 'react', 'nodejs', 'python', 'sql'];
  const keywordScore = skills.reduce((score, skill) => score + (normalized.includes(skill) ? 10 : 0), 0);
  const experienceMatch = normalized.match(/(\d+)\s+(?:años|año|years|year)/);
  const years = experienceMatch ? Number.parseInt(experienceMatch[1], 10) : 0;
  const experienceScore = Math.min(years * 5, 50);
  return { total: Math.min(keywordScore + experienceScore, 100), keywords: keywordScore, experience: experienceScore };
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    return (await parser.getText()).text || '';
  } finally {
    await parser.destroy();
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) return NextResponse.json({ error: 'Configuración faltante' }, { status: 500 });

  const supabase = createClient(url, serviceRole);
  const { data: authData, error: authError } = await supabase.auth.getUser(authHeader.slice(7));
  if (authError || !authData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await persistentRateLimit(`cv-analysis:${authData.user.id}`, 10, 86400000)).success) {
    return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });
  }

  const formData = await request.formData();
  const pdf = formData.get('pdf');
  const candidateId = formData.get('candidato_id');
  if (!(pdf instanceof File)) return NextResponse.json({ error: 'PDF file required' }, { status: 400 });
  if (pdf.type !== 'application/pdf') return NextResponse.json({ error: 'File must be PDF' }, { status: 400 });
  if (pdf.size > MAX_PDF_SIZE) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 });

  try {
    const extractedText = (await extractPdfText(Buffer.from(await pdf.arrayBuffer()))).trim();
    const evaluated = extractedText.length > 0;
    const score = evaluated ? calculateCVScore(extractedText) : { total: 0, keywords: 0, experience: 0 };
    const { error: insertError } = await supabase.from('cv_analysis').insert({
      usuario_id: authData.user.id,
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
