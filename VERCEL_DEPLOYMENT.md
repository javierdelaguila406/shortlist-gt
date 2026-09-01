# 🚀 PASO 5: Deployment en Vercel

**Tiempo estimado: 15 minutos**

---

## 📋 Prerequisitos

- Código en repositorio GitHub
- Cuenta Vercel (free tier suficiente)
- Credenciales Supabase, OpenAI y WhatsApp configuradas

---

## 1️⃣ PREPARAR CÓDIGO PARA GITHUB

### Paso 1.1: Inicializar Repositorio Git

```bash
cd "C:\Users\gabri\Desktop\Plataforma Web RR.HH\shortlist-gt"
git init
```

### Paso 1.2: Crear .gitignore

Asegúrate de que `.gitignore` tiene:

```
.env.local
.env*.local
node_modules/
.next/
out/
dist/
*.log
.DS_Store
```

### Paso 1.3: Commit Inicial

```bash
git add .
git commit -m "Initial commit: SHORTLIST.GT MVP with auth, dashboard, and WhatsApp integration"
```

### Paso 1.4: Crear Repositorio en GitHub

1. Abre https://github.com/new
2. Completa:
   - **Repository name**: `shortlist-gt`
   - **Description**: `Smart recruitment platform with AI-powered CV analysis and WhatsApp integration`
   - **Visibility**: Public (o Private si prefieres)
3. Clickea **"Create repository"**

### Paso 1.5: Push a GitHub

```bash
git branch -M main
git remote add origin https://github.com/TU_USUARIO/shortlist-gt.git
git push -u origin main
```

✅ **Código en GitHub**

---

## 2️⃣ CONFIGURAR VERCEL

### Paso 2.1: Conectar con Vercel

1. Abre https://vercel.com
2. Inicia sesión o crea cuenta
3. Clickea **"New Project"**
4. Conecta tu cuenta GitHub
5. Busca `shortlist-gt`
6. Clickea **"Import"**

### Paso 2.2: Configurar Proyecto

Vercel autodetectará:
- Framework: Next.js ✓
- Build Command: `npm run build` ✓
- Output Directory: `.next` ✓

**Configuración adicional:**

En **"Environment Variables"**, agrega:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-proj-...
WHATSAPP_BUSINESS_ACCOUNT_ID=123...
WHATSAPP_PHONE_NUMBER_ID=456...
WHATSAPP_ACCESS_TOKEN=EAAx...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-secret-token
NEXT_PUBLIC_APP_URL=https://shortlist-gt.vercel.app
```

### Paso 2.3: Deploy

Clickea **"Deploy"**

Espera a que se complete (2-5 minutos). Deberías ver:
- ✅ Build successful
- ✅ Domains configured
- ✅ Live on https://shortlist-gt.vercel.app

✅ **Proyecto deployado en Vercel**

---

## 3️⃣ ACTUALIZAR WHATSAPP WEBHOOK

### Paso 3.1: Actualizar URL en Meta

En Meta Developers (https://developers.facebook.com):

1. Clickea tu app (WhatsApp)
2. Clickea **"Configuration"** en WhatsApp
3. Actualiza Webhook URL:
   ```
   https://shortlist-gt.vercel.app/api/webhooks/whatsapp
   ```
4. Verifica que el Verify Token sea igual al de .env.local
5. Clickea **"Verify and Save"**

Deberías ver: "Webhook verified successfully"

✅ **Webhook actualizado**

---

## 4️⃣ TESTING EN PRODUCCIÓN

### Test 1: Acceder a la App

1. Abre https://shortlist-gt.vercel.app
2. Deberías ver homepage con:
   - ✅ Logo SHORTLIST.GT
   - ✅ Hero section
   - ✅ Features
   - ✅ Tech stack
   - ✅ Buttons funcionales

### Test 2: Signup

1. Clickea "Acceder"
2. Ir a `/auth/signup`
3. Crear usuario:
   - Nombre: Test User
   - Email: test@yourdomain.com
   - Password: Test123!
4. Deberías ser redirigido a `/auth/login`

### Test 3: Login

1. Ingresar credenciales
2. Deberías ir a `/dashboard`
3. Ver texto "Bienvenido, Test User"

### Test 4: Crear Vacante

1. Clickear "Nueva Vacante"
2. Llenar formulario:
   - Título: QA Engineer
   - Slug: qa-engineer
   - Descripción: Test job
3. Clickear "Crear Vacante"
4. Deberías ver detalle de vacante creada

### Test 5: Postulación

1. Ir a: https://shortlist-gt.vercel.app/postular/qa-engineer
2. Llenar formulario de candidato
3. Subir CV
4. Clickear "Enviar Solicitud"
5. Ver mensaje de éxito

### Test 6: Verificar en Supabase

En Supabase console:

```sql
-- Ver usuarios creados
SELECT * FROM usuarios;

-- Ver vacantes creadas
SELECT * FROM vacantes;

-- Ver candidatos postulados
SELECT * FROM candidatos;
```

Deberías ver los datos que acabas de crear.

✅ **App en producción funcionando**

---

## 🔄 DEPLOYMENT AUTOMÁTICO

Vercel automáticamente redeploy cuando:
- Pushs a `main` branch
- Creas una Pull Request
- Cambias variables de entorno

### Monitorear Deployments

1. Abre https://vercel.com/dashboard
2. Clickea tu proyecto `shortlist-gt`
3. Clickea **"Deployments"**
4. Verás historial de todos los deployments

---

## 🚨 Troubleshooting

### Error: "Cannot find module @supabase/supabase-js"
**Solución**: Vercel corre `npm install` automáticamente. Espera a que se complete.

### Error: "Failed to compile"
**Solución**: Revisar logs en Vercel console. Usualmente es un error de TypeScript.

### Error: "NEXT_PUBLIC_SUPABASE_URL is missing"
**Solución**: Agregar todas las variables de entorno en Vercel Settings → Environment Variables

### Error: "Webhook verification failed"
**Solución**: Verificar que WHATSAPP_WEBHOOK_VERIFY_TOKEN en Vercel coincida con Meta

### Error: "OpenAI API error: invalid api_key"
**Solución**: Verificar que OPENAI_API_KEY es correcto y comienza con `sk-`

---

## 📊 Monitorear en Producción

### Logs en Vercel

1. Dashboard → Tu proyecto
2. **"Logs"** → Elige tipo:
   - **Build Logs**: Ver proceso de compilación
   - **Runtime Logs**: Ver errores de la app
   - **Edge Logs**: Ver requests de usuarios

### Monitorar Performance

1. Dashboard → Tu proyecto
2. **"Analytics"** → Ver:
   - Response times
   - Edge requests
   - Cache hit ratio
   - Web Vitals

---

## 🔐 Seguridad en Producción

### Verificaciones

```
[ ] .env.local NO está en Git
[ ] .gitignore contiene .env*
[ ] Variables de entorno en Vercel (no en código)
[ ] HTTPS habilitado (automático)
[ ] Domain personalizado configurado (opcional)
```

### Domain Personalizado (Opcional)

1. Compra dominio en Namecheap, GoDaddy, etc.
2. En Vercel: **"Settings"** → **"Domains"**
3. Agrega tu dominio
4. Vercel te dará DNS records
5. Actualiza DNS en tu proveedor
6. Espera propagación (15-48 horas)

---

## 📈 Siguientes Pasos Post-Deployment

### Fase 6: Optimizaciones

- [ ] Agregar Google Analytics
- [ ] Configurar Sentry para error tracking
- [ ] Agregar backup automático en Supabase
- [ ] Crear pipeline de CI/CD
- [ ] Agregar tests automatizados

### Fase 7: Escalar

- [ ] Database upgrade en Supabase (si crece)
- [ ] CDN para assets
- [ ] Caché Redis
- [ ] Load balancing

---

## ✅ Checklist Final

```
CÓDIGO:
[ ] Git inicializado
[ ] .gitignore configurado
[ ] Commit inicial creado
[ ] Repositorio en GitHub

VERCEL:
[ ] Proyecto importado
[ ] Environment variables configuradas
[ ] Deploy completado
[ ] App en vivo

WHATSAPP:
[ ] Webhook URL actualizada
[ ] Webhook verificado
[ ] Token correcto

TESTING:
[ ] Homepage accesible
[ ] Signup funciona
[ ] Login funciona
[ ] Dashboard funciona
[ ] Crear vacante funciona
[ ] Postulación funciona
[ ] Datos en Supabase

SEGURIDAD:
[ ] .env.local no en Git
[ ] Variables en Vercel
[ ] HTTPS funcionando
[ ] API keys seguras
```

---

## 🎉 ¡Congratulaciones!

**SHORTLIST.GT está en producción y disponible en:**

```
https://shortlist-gt.vercel.app
```

Comparte este link con:
- Reclutadores para crear vacantes
- Candidatos para postularse
- Colegas para testing

---

## 📞 Soporte

Si tienes problemas:

1. Revisar Vercel logs
2. Revisar Supabase console
3. Revisar console del browser (F12)
4. Revisar GitHub actions (si están configuradas)

---

*Guía de Deployment en Vercel - PASO 5*  
*Actualizado: 1 de Septiembre, 2026*
