export const MAX_CV_BYTES = 5 * 1024 * 1024;

export function isPdf(bytes: Buffer): boolean {
  return bytes.subarray(0, 5).toString('latin1') === '%PDF-';
}

export async function extractPdfText(bytes: Buffer, timeoutMs = 10_000): Promise<string> {
  // pdf-parse/worker define DOMMatrix con @napi-rs/canvas y debe cargarse antes que pdf-parse.
  await import('pdf-parse/worker');
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: bytes });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('pdf-timeout')), timeoutMs);
    });
    const result = await Promise.race([parser.getText(), timeout]);
    return (result.text || '').replace(/--\s*\d+\s+of\s+\d+\s*--/g, '').trim();
  } finally {
    clearTimeout(timer);
    await parser.destroy();
  }
}
