# 🚀 FASE 3 EJECUCIÓN - Reportes y Datos Masivos

**Duración**: 4-6 horas  
**Criticidad**: P1/P2  
**Estado**: ✅ LISTO - FASE 2 completada  
**Ejecutor**: ChatGPT  
**Auditor**: Claude Code  

---

## 📊 RESUMEN

FASE 3 valida y mejora:
- Filtros de reportes (rango de fechas, validación)
- Scoring confiable (servidor, no cliente)
- Exportación masiva (validada en FASE 2, mejoras aquí)
- Generación de reportes estables

**Items**: 5 (validación + implementación)  
**Prerequisito**: ✅ FASE 2 completada  
**Parallelizable con**: FASE 4 (UI), FASE 5 (Privacidad)

---

## ✅ ITEM 1: Fijar Filtros de Reporte - Rango Invertido (45 minutos)

**Archivo**: `components/ReportModal.tsx` o equivalente

**Defecto actual**: Rango invertido (desde > hasta) no genera error

**Cambio requerido**:

```typescript
// En el componente de filtro:
const [startDate, setStartDate] = useState<Date | null>(null);
const [endDate, setEndDate] = useState<Date | null>(null);
const [error, setError] = useState<string>('');

const handleExport = () => {
  // Validación 1: Ambas fechas requeridas
  if (!startDate || !endDate) {
    setError('Debes seleccionar fecha inicial y final');
    return;
  }

  // Validación 2: Rango válido
  if (startDate > endDate) {
    setError('La fecha inicial debe ser anterior a la final');
    return;
  }

  // Validación 3: Rango razonable (ej: no más de 2 años)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 730) {
    setError('El rango no puede ser mayor a 2 años');
    return;
  }

  // Proceder con exportación
  exportReport({ startDate, endDate });
};
```

**Pruebas**:

```
Test 1 - Rango válido:
- Desde: 2026-01-01
- Hasta: 2026-03-31
- Esperado: Exportación procedida ✅

Test 2 - Rango invertido:
- Desde: 2026-03-31
- Hasta: 2026-01-01
- Esperado: Error "La fecha inicial debe ser anterior a la final" ✅

Test 3 - Fecha inicial faltando:
- Desde: (vacío)
- Hasta: 2026-03-31
- Esperado: Error "Debes seleccionar fecha inicial y final" ✅

Test 4 - Rango > 2 años:
- Desde: 2020-01-01
- Hasta: 2026-12-31
- Esperado: Error "El rango no puede ser mayor a 2 años" ✅

Test 5 - Mismo día (válido):
- Desde: 2026-03-15
- Hasta: 2026-03-15
- Esperado: Exportación procedida ✅
```

**Reporta**:
- ✅ Todos los tests pasan
- ❌ [Describe si alguno falla]

---

## ✅ ITEM 2: Implementar Scoring Confiable (Servidor) (1.5 horas)

**Objetivo**: Scoring se calcula en servidor, no se confía en cliente

**Defecto actual**: Cliente envía `cvText` y score es calculado/manipulado en cliente

**Cambio requerido**: Servidor extrae PDF, calcula score

**Archivo**: `app/api/cv/route.ts`

**Implementación**:

```typescript
import pdfParse from 'pdf-parse';

export async function POST(request: Request) {
  // 1. Validar autenticación
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Obtener userId del JWT
  const decoded = jwtDecode(authHeader.replace('Bearer ', ''));
  const userId = decoded.sub;

  // 3. Obtener archivo PDF del request
  const formData = await request.formData();
  const pdfFile = formData.get('pdf') as File;

  if (!pdfFile) {
    return NextResponse.json({ error: 'PDF file required' }, { status: 400 });
  }

  // 4. Validar tipo de archivo
  if (pdfFile.type !== 'application/pdf') {
    return NextResponse.json({ error: 'File must be PDF' }, { status: 400 });
  }

  // 5. Validar tamaño (máx 10MB)
  if (pdfFile.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 });
  }

  try {
    // 6. Convertir archivo a buffer
    const buffer = Buffer.from(await pdfFile.arrayBuffer());

    // 7. Extraer texto del PDF (servidor)
    const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF', score_total: 0, evaluated: false },
        { status: 200 }
      );
    }

    // 8. Calcular score en servidor (NO en cliente)
    const scoreData = calculateCVScore(extractedText);

    // 9. Registrar análisis en BD
    await supabase
      .from('cv_analysis')
      .insert({
        usuario_id: userId,
        pdf_filename: pdfFile.name,
        text_extracted: extractedText.substring(0, 5000), // guardar primeros 5000 chars
        score_total: scoreData.total,
        score_keywords: scoreData.keywords,
        score_experience: scoreData.experience,
        evaluated: true,
        analyzed_at: new Date(),
      });

    console.log('[CV Analysis] Processed for user', userId);

    return NextResponse.json({
      score_total: scoreData.total,
      score_keywords: scoreData.keywords,
      score_experience: scoreData.experience,
      evaluated: true,
      message: 'CV analyzed successfully',
    });

  } catch (error) {
    console.error('[CV Analysis] Error:', error instanceof Error ? error.message : 'unknown');

    return NextResponse.json(
      { error: 'Failed to analyze CV', evaluated: false },
      { status: 500 }
    );
  }
}

function calculateCVScore(text: string) {
  const lowerText = text.toLowerCase();

  // Scoring keywords (ejemplos)
  const keywords = {
    skills: ['typescript', 'react', 'nodejs', 'python', 'sql'],
    experience: ['años', 'año', 'experience', 'years'],
  };

  let keywordScore = 0;
  for (const keyword of keywords.skills) {
    if (lowerText.includes(keyword)) keywordScore += 10;
  }

  let experienceScore = 0;
  const experienceMatch = text.match(/(\d+)\s+(?:años|years|year|año)/);
  if (experienceMatch) {
    const years = parseInt(experienceMatch[1]);
    experienceScore = Math.min(years * 5, 50); // máx 50 points
  }

  const total = Math.min(keywordScore + experienceScore, 100);

  return {
    total,
    keywords: keywordScore,
    experience: experienceScore,
  };
}
```

**Pruebas**:

```
Test 1 - PDF válido:
- Upload CV real (PDF)
- Esperado: score_total entre 0-100, evaluated=true ✅

Test 2 - PDF sin texto (imagen):
- Upload PDF con solo imágenes
- Esperado: score_total=0, evaluated=false ✅

Test 3 - Archivo no-PDF:
- Upload .docx, .txt, .jpg
- Esperado: 400 "File must be PDF" ✅

Test 4 - Archivo muy grande:
- Upload PDF > 10MB
- Esperado: 413 "File too large" ✅

Test 5 - Sin autenticación:
- POST sin Authorization header
- Esperado: 401 Unauthorized ✅

Test 6 - Cálculo de score consistente:
- Upload mismo PDF dos veces
- Esperado: Mismo score ambas veces ✅

Test 7 - Score en servidor (no del cliente):
- Verificar que cliente NO envía score
- Servidor lo calcula internamente ✅
```

**Validación en código**:
- ❌ NO debe haber `const { score } = body;`
- ✅ DEBE calcular en servidor: `calculateCVScore(extractedText)`
- ✅ DEBE loguear: `[CV Analysis] Processed for user [userId]`
- ✅ DEBE guardar en BD: tabla `cv_analysis`

**Reporta**:
- ✅ Todos los tests pasan
- ✅ Score calculado en servidor
- ✅ BD registra análisis
- ❌ [Describe si algo falla]

---

## ✅ ITEM 3: Validar Datos de Reportes en Masa (1 hora)

**Objetivo**: Reportes con múltiples candidatos son correctos

**Archivo**: `app/api/reportes/candidatos/route.ts` (o equivalente)

**Pruebas**:

```
Test 1 - Reporte con 100 candidatos:
- Crear vacante
- Postular 100 candidatos
- Generar reporte
- Verificar:
  ✅ Todos 100 aparecen
  ✅ Campos completos (email, score, estado)
  ✅ Orden correcto (por fecha o score)
  ✅ Sin duplicados

Test 2 - Reporte con candidatos sin score:
- Algunos candidatos sin CV analizado
- Esperado: score_total = null o 0 (no error)
  Mostrar "No evaluado" en reporte

Test 3 - Reporte filtra por estado:
- Crear candidatos con estados: aceptado, rechazado, pendiente
- Generar con filtro estado='aceptado'
- Esperado: Solo aceptados aparecen

Test 4 - Reporte con datos especiales:
- Email con caracteres: test+alias@domain.co
- Nombre con acentos: José María López
- Empresa con &: "Tech & Solutions"
- Esperado: Sin corrupción de datos en reporte

Test 5 - Performance:
- 1000 candidatos
- Generar reporte
- Esperado: Completa en < 10 segundos
```

**Reporta**:
- ✅ Todos los tests pasan
- ✅ Reporte con 100+ candidatos correcto
- ✅ Datos sin corrupción
- ✅ Performance < 10s
- ❌ [Describe si algo falla]

---

## ✅ ITEM 4: Comparativa PDF vs Excel (45 minutos)

**Objetivo**: Datos coinciden entre PDF y Excel

**Pruebas**:

```
Test 1 - Crear reporte con 20 candidatos
Test 2 - Exportar a PDF
Test 3 - Exportar a Excel
Test 4 - Comparar:
  ✅ Número de registros coincide (PDF == Excel)
  ✅ Totales de score coinciden
  ✅ Fechas iguales
  ✅ Estados iguales
  ✅ Sin datos faltantes
  ✅ Formato de números consistente (decimales)
  ✅ Headers iguales en ambos formatos
```

**Validación manual**:
- Abrir PDF en visor (Adobe, Chrome)
- Abrir Excel en spreadsheet (Google Sheets, Excel)
- Comparar visualmente 10 registros aleatorios
- Verificar que coinciden exactamente

**Reporta**:
- ✅ PDF y Excel coinciden
- ✅ Sin discrepancias de datos
- ❌ Discrepancias encontradas: [describe]

---

## ✅ ITEM 5: Auditoría de Reportes en Logs (45 minutos)

**Objetivo**: Registrar qué reportes se generan (sin PII)

**Cambios en endpoints de reporte**:

```typescript
// En app/api/reportes/candidatos/route.ts
const { startDate, endDate, formato, vacante_id } = body;

// Antes de generar
const reportId = crypto.randomUUID();

console.log('[Report] Generated', {
  reportId,
  userId,
  vacante_id,
  formato,
  startDate: startDate.toISOString(),
  endDate: endDate.toISOString(),
  timestamp: new Date().toISOString(),
});

// No loguear: candidato emails, scores individuales, datos personales

// Después de generar (opcional)
console.log('[Report] Completed', {
  reportId,
  candidatosCount,
  durationMs,
  fileSize,
});
```

**Pruebas**:

```
Test 1 - Generar 5 reportes diferentes
Test 2 - Revisar logs
Test 3 - Verificar:
  ✅ Cada reporte tiene reportId único
  ✅ userId registrado
  ✅ vacante_id registrado
  ✅ Formato registrado
  ✅ Fechas registradas
  ✅ Timestamp correcto
  
Test 4 - Verificar QUE NO ESTÁ:
  ✅ NO loguea emails de candidatos
  ✅ NO loguea CVs o textos
  ✅ NO loguea tokens o auth headers
```

**Validación**:

```bash
# Buscar PII en logs de reportes
grep -r "reportes" logs/ \
  | grep -iE "email|password|token|cv|pdf" \
  | wc -l

# Esperado: 0
```

**Reporta**:
- ✅ Logging implementado sin PII
- ✅ 0 coincidencias de PII en logs
- ❌ [Describe si algo falla]

---

## 🎯 REPORTE FINAL FASE 3

```
FASE 3 COMPLETADA

ITEM 1: Filtros rango invertido    [✅ / ❌]
ITEM 2: Scoring servidor (no cliente) [✅ / ❌]
ITEM 3: Datos masivos correctos    [✅ / ❌]
ITEM 4: PDF vs Excel coinciden     [✅ / ❌]
ITEM 5: Auditoría de reportes      [✅ / ❌]

RESUMEN: [✅ TODOS COMPLETOS] o [❌ PENDIENTES: ___]

Validaciones:
✅ Tests pasan
✅ TypeScript sin errores
✅ Build de producción exitoso
✅ Cero PII en logs

Si TODO está ✅:
Confirma que estás listo para que Claude haga commit + push + luz verde para FASE 4
```

---

**Documento**: FASE 3 Ejecución  
**Duración**: 4-6 horas  
**Prerequisito**: FASE 2 ✅ completada  
**Parallelizable**: Con FASE 4 (UI) y FASE 5 (Privacidad)  
**Estado**: 🚀 LISTO PARA EJECUTAR
