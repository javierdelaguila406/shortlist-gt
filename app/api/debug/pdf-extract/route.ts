import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';

export async function POST(request: NextRequest) {
  try {
    const buffer = await request.arrayBuffer();
    console.log('[DEBUG] PDF buffer size:', buffer.byteLength);

    const data = await pdfParse(Buffer.from(buffer));
    console.log('[DEBUG] PDF parsed:', { pages: data.numpages, text_length: data.text?.length });

    return NextResponse.json({
      success: true,
      pages: data.numpages,
      text_length: data.text?.length || 0,
      text_preview: data.text?.substring(0, 200) || '',
    });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 });
  }
}
