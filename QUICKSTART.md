# 🚀 QUICKSTART - SHORTLIST.GT

## Próximos 15 Minutos

### 1. Verifica que el proyecto está funcionando

```bash
cd "C:\Users\gabri\Desktop\Plataforma Web RR.HH\shortlist-gt"
npm run dev
```

Visita http://localhost:3000 - deberías ver la landing page con hero, features y footer.

### 2. Explora las pantallas

- ✅ **Homepage**: http://localhost:3000 (Landing premium)
- ✅ **Postular**: http://localhost:3000/postular/sample (Formulario candidatos)
- ✅ **Dashboard**: http://localhost:3000/dashboard/vacantes/1 (Vista reclutador con mock data)

### 3. Inspecciona la estructura

Carpetas clave:
```
app/                    # Rutas y páginas
├── dashboard/          # Vista para reclutadores
├── postular/           # Landing para candidatos
├── api/                # Endpoints
└── page.tsx            # Homepage

components/ui/          # Componentes reutilizables
lib/supabase.ts         # Configuración BD
supabase/schema.sql     # Schema de base de datos
```

---

## Primeros Pasos para Producción

### ✅ Paso 1: Configurar Supabase (5 min)

1. Crea account en [supabase.com](https://supabase.com)
2. Nuevo proyecto (elige region más cercana)
3. Ve a SQL Editor → New Query
4. Copia el contenido de `supabase/schema.sql`
5. Ejecuta (Cmd+Enter)
6. Ve a Authentication → Disable email confirmation
7. Copia tu URL y keys

Actualiza `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### ✅ Paso 2: Configurar OpenAI (2 min)

1. Ve a [platform.openai.com](https://platform.openai.com)
2. API Keys → Create new secret key
3. Copia la key

Actualiza `.env.local`:
```env
OPENAI_API_KEY=sk-proj-...
```

### ✅ Paso 3: Configurar WhatsApp (10 min)

1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Crear app → WhatsApp → Acceso a API
3. Configura Webhook:
   - URL: `https://yourdomain.com/api/webhooks/whatsapp`
   - Verify Token: Cualquier string que guardes
4. Suscribirse a `messages` y `message_status`
5. Obtener Access Token

Actualiza `.env.local`:
```env
WHATSAPP_BUSINESS_ACCOUNT_ID=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Testeo Local Completo

```bash
# 1. Terminal 1: Dev server
npm run dev

# 2. Terminal 2: Tests (cuando estén configurados)
npm run test

# 3. Visita en browser
http://localhost:3000                    # Homepage
http://localhost:3000/postular/test      # Formulario (reemplaza slug)
http://localhost:3000/dashboard/vacantes/1   # Dashboard
```

### Test Formulario
1. Ir a http://localhost:3000/postular/sample
2. Completar: Nombre, Email, Teléfono, Disponibilidad
3. Arrastrar PDF o seleccionar archivo
4. Enviar → Ver respuesta JSON en console

### Test API CV
```bash
curl -X POST http://localhost:3000/api/cv \
  -H "Content-Type: application/json" \
  -d '{
    "cvText": "Senior React Developer with 5 years experience...",
    "jobDescription": "We need a React expert...",
    "candidatoId": "test-uuid"
  }'
```

---

## Deployment a Vercel

### 1. Push a Git (si no lo has hecho)

```bash
git init
git add .
git commit -m "Initial commit: SHORTLIST.GT MVP"
git branch -M main
git remote add origin https://github.com/yourusername/shortlist-gt.git
git push -u origin main
```

### 2. Deploy

1. Ve a [vercel.com](https://vercel.com)
2. Conecta tu repositorio GitHub
3. Configura variables de entorno (mismas del .env.local)
4. Deploy

**Tu app estará en**: https://shortlist-gt.vercel.app

### 3. Actualizar Webhook de WhatsApp

En Meta Developers:
- Webhook URL: https://shortlist-gt.vercel.app/api/webhooks/whatsapp
- Test: Enviar mensaje de prueba desde WhatsApp Business

---

## Checklist de Integración

- [ ] Supabase configurado y schema ejecutado
- [ ] OpenAI API key activa
- [ ] WhatsApp Business Account configurado
- [ ] .env.local completado con todas las variables
- [ ] Servidor local funciona sin errores
- [ ] Landing page se carga correctamente
- [ ] Formulario envía datos a Supabase
- [ ] Dashboard muestra datos mock
- [ ] Build producción sin errores (`npm run build`)

---

## Estructura de Datos (Mock para Testing)

### Crear vacante (en Supabase SQL)
```sql
INSERT INTO vacantes (usuario_id, titulo, slug, descripcion)
VALUES (
  'YOUR_USER_ID',
  'Senior React Developer',
  'senior-react',
  'Buscamos un desarrollador React senior...'
);
```

### Ver candidatos postulados
```sql
SELECT c.nombre, c.score_total, c.estado
FROM candidatos c
WHERE c.vacante_id = 'VACANCY_ID'
ORDER BY c.score_total DESC;
```

---

## Troubleshooting Rápido

### Error: "supabaseUrl is required"
**Solución**: Verifica que `.env.local` existe y tiene `NEXT_PUBLIC_SUPABASE_URL`

### Error: "Cannot find module @supabase/supabase-js"
**Solución**: Ejecuta `npm install`

### Error: "OpenAI API key not valid"
**Solución**: Verifica que OPENAI_API_KEY en `.env.local` es correcto

### Error en formulario: "404 Not Found"
**Solución**: Verifica que el servidor dev está corriendo en otra terminal

### WhatsApp no envía mensajes
**Solución**: Verifica WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID en .env.local

---

## Documentación Completa

Para más detalles, ver:
- [README.md](./README.md) - Documentación completa
- [MVP_SUMMARY.md](./MVP_SUMMARY.md) - Resumen técnico
- [CLAUDE.md](../CLAUDE.md.txt) - Reglas del proyecto

---

## Próximas Features

### Corto Plazo (Week 1)
- [ ] Autenticación Supabase (Login/Signup)
- [ ] Upload real de CVs a Supabase Storage
- [ ] Processing de CVs con OpenAI
- [ ] Envío de primer mensaje WhatsApp

### Mediano Plazo (Week 2-3)
- [ ] Recepción de videos vía WhatsApp
- [ ] Transcripción con Whisper API
- [ ] Sistema de preguntas de test
- [ ] Cálculo automático de scores

### Largo Plazo (Week 4+)
- [ ] Dashboard de analytics
- [ ] Integración con LinkedIn
- [ ] Calendar booking (Calendly integration)
- [ ] Reportes descargables
- [ ] Tests automatizados

---

## Support

Si encuentras issues:

1. Chequea la terminal para errores
2. Verifica que `.env.local` está completo
3. Limpia cache: `rm -rf .next` y reinicia dev server
4. Revisa logs en Supabase Console
5. Verifica que todas las variables están en Vercel si deployaste

---

¡Listo para construir! 🚀

*Última actualización: 31 de Agosto, 2026*
