# 🧪 GUÍA COMPLETA DE TESTING

## OBJETIVO
Validar que los 3 requisitos funcionan correctamente end-to-end:
1. ✅ Extracción de email del CV
2. ✅ Visualización de PDF en dashboard
3. ✅ Scoring correcto

---

## 📋 TEST 1: Extracción de Email (Crítico)

### Paso 1: Preparar PDF de prueba
1. Abre Notepad/Word
2. Crea un documento con este contenido:
```
Juan Pérez
Desarrollador Python Backend

Email: juan.perez@gmail.com
Teléfono: +502 7123 4567

Experiencia: 5 años en Python, Django, FastAPI, PostgreSQL
Educación: Licenciatura en Ingeniería en Sistemas
```
3. Guarda como `test_cv.pdf`

### Paso 2: Crear vacante de prueba
1. Ve a Dashboard: https://shortlist-gt.vercel.app/dashboard/reclutador
2. Clic en "Crear Vacante"
3. Rellena:
   - **Título:** Desarrollador Python Backend
   - **Descripción:** Buscamos desarrollador con Python, Django, FastAPI, PostgreSQL, Docker, Kubernetes. Mínimo 3 años experiencia.
   - **Departamento:** Tecnología
4. Clic en "Crear Vacante"
5. **Anota el ID de vacante** que aparezca en el dropdown

### Paso 3: Postularse con PDF
1. Ve a la ruta de postulación (obtén el slug de la vacante)
2. URL debe ser: `https://shortlist-gt.vercel.app/postular/[slug-o-id]`
3. Rellena formulario:
   - **Nombre:** Juan Pérez
   - **Email:** DEJA VACÍO (para testear extracción del PDF)
   - **Teléfono:** +502 7123 4567
   - **CV:** Carga el PDF
   - **Habilidades:** Python, Django, FastAPI, 5 años experiencia
4. Acepta consentimiento y envía

### Paso 4: Verificar en Dashboard
1. Dashboard debe mostrar candidato nuevo
2. **VERIFICAR:**
   - ✅ Email aparece: `juan.perez@gmail.com` (extraído del PDF)
   - ✅ Score aparece: mínimo 70 (para "precalificado")
   - ✅ Link "Ver PDF del CV" está visible

### Paso 5: Verificar en Supabase
1. Ve a Supabase Dashboard → SQL Editor
2. Ejecuta:
```sql
SELECT nombre, email, cv_url, score_ia, estado 
FROM candidatos 
ORDER BY created_at DESC 
LIMIT 1;
```

**DEBE RETORNAR:**
- email: `juan.perez@gmail.com` ✅
- cv_url: URL que empiece con `https://...cvs/...` ✅
- score_ia: >= 70 ✅
- estado: `precalificado` ✅

---

## 📋 TEST 2: Visualización de PDF (Crítico)

### Paso 1: Hacer clic en "Ver PDF del CV"
1. En Dashboard, haz clic en el candidato que creaste
2. En panel derecho, busca el link "📄 Ver PDF del CV"
3. Haz clic

**DEBE PASAR:**
- ✅ Se abre el PDF en nueva ventana
- ✅ PDF es legible
- ✅ URL es pública (puedes compartirla sin login)

### Paso 2: Verificar URL en Supabase
1. Supabase Dashboard → Storage → cvs
2. **DEBE HABER UN ARCHIVO:** `candidato-TIMESTAMP.pdf`
3. Haz clic derecho en el archivo → "Copy public URL"
4. Pega la URL en navegador
5. **DEBE DESCARGAR O ABRIR EL PDF**

### Paso 3: Verificar en código de página
1. En el navegador, panel de detalles del candidato
2. Abre DevTools (F12)
3. En elemento "Ver PDF del CV", inspecciona
4. **href DEBE CONTENER:**
   - `https://...supabase.co/storage/...cvs/`
   - Nombre de archivo con formato `candidato-TIMESTAMP.pdf`

---

## 📋 TEST 3: Scoring Correcto (Crítico)

### Paso 1: Verificar lógica de scoring
**Fórmula esperada:**
- Base: 30 puntos
- +3 por cada palabra clave que coincide
- +20 si cubre todos los requisitos
- +20 si tiene 5+ años
- +10 si tiene educación formal
- +8 si tiene certificaciones
- MAX: 100, MIN: 20

### Paso 2: Calcular score esperado para el test
**Vacante requiere:** Python, Django, FastAPI, PostgreSQL, Docker, Kubernetes (6 skills)

**CV tiene:** Python ✅, Django ✅, FastAPI ✅, PostgreSQL ✅ = 4 matches

**Cálculo:**
```
Base:                30
4 keywords × 3:      +12
Cobertura 67%:       +13 (4/6 = 0.67 × 20)
5+ años exp:         +20
Educación (Lic):     +10
─────────────────────────
Total:               85 puntos ✅
```

**VERIFICAR en Supabase:**
```sql
SELECT nombre, score_ia, estado FROM candidatos 
WHERE nombre = 'Juan Pérez';
```
- Score debe ser 85-90 (rango aceptable) ✅
- Estado debe ser `precalificado` (score >= 70) ✅

### Paso 3: Ver logs de scoring
1. Vercel Dashboard → Deployments → Latest
2. Haz clic en "View Logs"
3. Busca líneas que digan `[SCORING]`
4. **DEBE VER:**
```
[SCORING] Matches: 4/6
[SCORING] Cobertura: 67% (+13 pts)
[SCORING] Experiencia: 5 años (+20 pts)
[SCORING] Educación detectada (+10 pts)
[SCORING] Score final: 85/100
```

---

## 🔴 TEST 4: Casos Borde (Importante)

### Test 4a: PDF sin email
**Caso:** PDF sin email, campo email vacío

1. Crea PDF sin email
2. Postúlate sin poner email
3. **DEBE FALLAR CON ERROR:** "Email requerido"
4. ✅ Luego llenar el email y enviar

### Test 4b: PDF con email mal formateado
**Caso:** PDF con texto tipo "email: juan AT gmail DOT com"

1. El regex no extraerá
2. Sistema pide email en formulario
3. ✅ Campo email es requerido ahora

### Test 4c: CV muy corto
**Caso:** CV con menos de 10 caracteres

1. Score debe ser mínimo (20)
2. Estado debe ser `pendiente`
3. ✅ Sin errores

### Test 4d: Sin PDF (solo habilidades)
**Caso:** No cargar PDF, solo llenar campo de habilidades

1. Postúlate sin PDF
2. **DEBE FUNCIONAR** - scoring se hace con habilidades text
3. cv_url estará vacío (es normal)
4. ✅ Sin errores

---

## 📊 TEST 5: Validación de Datos Completa

### SQL para auditar datos
```sql
-- Ver último candidato
SELECT 
  id, nombre, email, telefono, 
  cv_url, score_ia, estado, 
  created_at
FROM candidatos 
ORDER BY created_at DESC 
LIMIT 1;

-- Ver todos los candidatos de una vacante
SELECT 
  nombre, email, score_ia, estado
FROM candidatos 
WHERE vacante_id = 'vacante-XXX'
ORDER BY score_ia DESC;

-- Ver PDFs guardados
SELECT name, size, created_at 
FROM storage.objects 
WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'cvs')
ORDER BY created_at DESC;
```

### Validaciones
- [ ] Email siempre presente (NOT NULL)
- [ ] Score entre 20-100
- [ ] cv_url contiene "supabase.co/storage"
- [ ] Estado es "precalificado" O "pendiente"
- [ ] PDFs existen en Storage

---

## ✅ CHECKLIST DE APROBACIÓN

### Requisito 1: Extracción de Email
- [ ] Email extraído correctamente del PDF
- [ ] Fallback a email del formulario funciona
- [ ] Email guardado en BD
- [ ] Error 400 si email no disponible

### Requisito 2: Mostrar PDF
- [ ] Link "Ver PDF del CV" visible en dashboard
- [ ] PDF es accesible vía URL pública
- [ ] URL guardada en cv_url
- [ ] PDF se descarga/abre correctamente

### Requisito 3: Scoring Correcto
- [ ] Score se calcula basado en plaza
- [ ] Palabras clave se extraen bien
- [ ] Cobertura se calcula correctamente
- [ ] Bonuses por experiencia/educación aplican
- [ ] Score 20-100

### Integración
- [ ] No hay errores en Vercel logs
- [ ] API responde rápido (< 2s)
- [ ] Dashboard carga candidatos
- [ ] Supabase Storage funciona
- [ ] BD se actualiza correctamente

---

## 🚨 TROUBLESHOOTING

### "Error: candidatos table doesn't exist"
→ Crear tabla en Supabase:
```sql
CREATE TABLE candidatos (
  id TEXT PRIMARY KEY,
  vacante_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  cv_url TEXT
);
```

### "PDF saved but URL is empty"
→ El bucket 'cvs' no existe
→ Crear en Storage → Buckets

### "Email is undefined in response"
→ Error 226 que ya arreglamos
→ Verifica que deployaste el fix

### "CV_url not showing in PDF link"
→ Candidates son old data sin cv_url
→ Crea nuevo candidato después del fix

### "Score is always 20"
→ extractKeywords retorna array vacío
→ Verificar CV text y descripción plaza

---

## 📞 VERIFICACIÓN FINAL

**Después de completar todos los tests:**

1. ✅ Email extraído: SÍ / NO
2. ✅ PDF guardado: SÍ / NO
3. ✅ PDF visible: SÍ / NO
4. ✅ Score correcto: SÍ / NO
5. ✅ Sin errores en logs: SÍ / NO

**SI TODOS SON SÍ → SISTEMA AL 100% FUNCIONAL ✅**

