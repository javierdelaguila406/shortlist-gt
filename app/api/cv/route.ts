import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { supabase } from '@/lib/supabase';
import { cvAnalysisSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: máx 20 análisis por IP cada 10 minutos
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      '127.0.0.1';
    const rateLimitResult = rateLimit(`cv-analysis:${ipAddress}`, 20, 600000); // 10 min

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta más tarde.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 600),
          }
        }
      );
    }

    const body = await request.json();

    // Validar con Zod
    const validation = cvAnalysisSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validación fallida', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { cvText, jobDescription, candidatoId, cvPath } = validation.data;

    let textToAnalyze = cvText;

    // Si se proporciona cvPath, extraer texto del PDF
    if (cvPath && !cvText) {
      try {
        const filePath = path.join(process.cwd(), 'public', cvPath);
        console.log('[CV-ANALYSIS] Reading PDF from:', filePath);

        if (fs.existsSync(filePath)) {
          try {
            const fileBuffer = fs.readFileSync(filePath);
            console.log('[CV-ANALYSIS] PDF file size:', fileBuffer.length, 'bytes');

            // Extraer texto del buffer (fallback simple pero efectivo)
            const extractedText = fileBuffer.toString('utf-8', 0, Math.min(50000, fileBuffer.length));
            const cleanedText = extractedText.replace(/[^\w\s\-.,()\/\n]/g, ' ').trim();

            if (cleanedText && cleanedText.length > 50) {
              textToAnalyze = cleanedText;
              console.log('[CV-ANALYSIS] Extracted text length:', textToAnalyze.length);
            } else {
              console.warn('[CV-ANALYSIS] Extracted text too short, may be binary PDF');
              textToAnalyze = `[CV NOTICE] CV file received but appears to be image-based or encrypted PDF. Reclutador debe revisar manualmente el archivo.`;
            }
          } catch (pdfError) {
            console.error('[CV-ANALYSIS] Error reading PDF:', pdfError);
            textToAnalyze = `[ERROR] No se pudo leer el archivo PDF correctamente.`;
          }
        } else {
          console.warn('[CV-ANALYSIS] CV file not found at:', filePath);
          textToAnalyze = `[ERROR] Archivo CV no encontrado en el servidor.`;
        }
      } catch (error) {
        console.error('[CV-ANALYSIS] Critical error:', error);
        textToAnalyze = `[ERROR] Error crítico leyendo archivo: ${error instanceof Error ? error.message : 'Unknown'}`;
      }
    }

    // Si aún no hay texto, usar información disponible
    if (!textToAnalyze) {
      textToAnalyze = `[FALLBACK] No se pudo extraer texto del CV. El análisis será limitado.`;
    }

    console.log('[CV-ANALYSIS] Final text length for OpenAI:', textToAnalyze.length);

    // Call OpenAI to analyze CV with structured output
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert recruiter AI specializing in technical hiring.

Analyze the provided CV against the job description and provide a detailed evaluation.

Always respond with valid JSON in this exact format:
{
  "overall_score": <0-100>,
  "skills_match": <0-100>,
  "experience_match": <0-100>,
  "education_match": <0-100>,
  "key_strengths": ["strength1", "strength2", "strength3"],
  "gaps": ["gap1", "gap2"],
  "recommendation": "high|medium|low",
  "summary": "brief 2-3 sentence summary",
  "years_experience": <number>,
  "languages": ["language1", "language2"],
  "technical_skills": ["skill1", "skill2"]
}

Be objective and fair. Consider:
- Direct experience match with job requirements
- Transferable skills from other domains
- Education and certifications relevant to the role
- Any red flags or concerns
- Growth potential of the candidate`,
        },
        {
          role: 'user',
          content: `
Job Description:
${jobDescription}

Candidate CV:
${textToAnalyze}

Provide a detailed analysis of how well this candidate matches the job requirements. Return only valid JSON.`,
        },
      ],
    });

    const analysisText = response.choices[0]?.message?.content;
    if (!analysisText) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(analysisText);

    // Actualizar candidato en Supabase con los scores
    if (candidatoId) {
      try {
        const { error: updateError } = await supabase
          .from('candidatos')
          .update({
            score_cv: Math.round(analysis.overall_score),
            metadata: {
              cv_analysis: analysis,
              analyzed_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', candidatoId);

        if (updateError) {
          console.error('Error updating candidato scores:', updateError);
        }
      } catch (error) {
        console.error('Error updating Supabase:', error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        analysis,
        message: 'CV analyzed successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    // Log interno - NUNCA expongas errores al cliente
    console.error('[SECURITY] Error processing CV:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: 'Ocurrió un error al analizar el CV. Por favor intenta más tarde.' },
      { status: 500 }
    );
  }
}
