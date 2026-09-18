import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Leer el archivo HTML del manual
    const filePath = path.join(process.cwd(), 'MANUAL_DE_USUARIO.html');
    const htmlContent = fs.readFileSync(filePath, 'utf-8');

    // Retornar el HTML para que el cliente lo convierta a PDF
    return NextResponse.json({
      success: true,
      html: htmlContent,
      filename: 'MANUAL_DE_USUARIO.html',
    });
  } catch (error) {
    console.error('[DESCARGAR-MANUAL] Error:', error);
    return NextResponse.json(
      { error: 'Error generando manual' },
      { status: 500 }
    );
  }
}
