# 🔑 PASO 1: Configurar Credenciales Reales

**Tiempo estimado: 20 minutos**

---

## 📋 Prerequisitos

- Cuenta de Google/Email
- Navegador web
- Acceso a tu dominio (para WhatsApp)
- Terminal/PowerShell

---

## 1️⃣ SUPABASE SETUP (5 minutos)

### Paso 1.1: Crear Proyecto

1. Abre https://supabase.com
2. Clickea **"Start your project"**
3. Inicia sesión o crea cuenta
4. Clickea **"New project"**

Completa:
```
Project Name:        shortlist-gt
Database Password:   [genera una segura]
Region:              [elige más cercana a ti]
Pricing Plan:        Free (suficiente para MVP)
```

5. Espera a que se cree (2-3 minutos)

### Paso 1.2: Ejecutar Schema SQL

Una vez creado:

1. En el dashboard, clickea **"SQL Editor"** en el lado izquierdo
2. Clickea **"New Query"**
3. En el editor, borra el contenido por defecto
4. **Copia TODO el contenido de `supabase/schema.sql`**
5. Pégalo en el editor
6. Clickea **"Run"** o presiona `Ctrl+Enter`

Espera a que se complete (deberías ver: "Execution completed successfully")

✅ **Schema ejecutado**

### Paso 1.3: Obtener Credenciales

1. Clickea **"Settings"** en el lado izquierdo
2. Clickea **"API"** en el submenu
3. Copia estos valores:

```
Project URL:        https://your-project.supabase.co
Anon Public Key:    eyJ... (supabase_url)
Service Role Key:   eyJ... (supabase_key)
```

### Paso 1.4: Actualizar .env.local

Abre `.env.local` y reemplaza:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI (pendiente)
OPENAI_API_KEY=sk-placeholder

# WhatsApp (pendiente)
WHATSAPP_BUSINESS_ACCOUNT_ID=placeholder
WHATSAPP_PHONE_NUMBER_ID=placeholder
WHATSAPP_ACCESS_TOKEN=placeholder
WHATSAPP_WEBHOOK_VERIFY_TOKEN=placeholder

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

✅ **Supabase configurado**

---

## 2️⃣ OPENAI SETUP (2 minutos)

### Paso 2.1: Crear API Key

1. Abre https://platform.openai.com
2. Inicia sesión o crea cuenta
3. Clickea tu perfil en arriba a la derecha
4. Clickea **"API keys"**
5. Clickea **"Create new secret key"**
6. Dale nombre: `shortlist-gt`
7. Copia la key (solo aparece una vez)

```
sk-proj-...
```

### Paso 2.2: Actualizar .env.local

```env
OPENAI_API_KEY=sk-proj-...
```

**Verificación rápida:**
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-proj-..."
```

Deberías ver lista de modelos.

✅ **OpenAI configurado**

---

## 3️⃣ WHATSAPP SETUP (13 minutos)

### Paso 3.1: Crear Meta Business Account

1. Abre https://developers.facebook.com
2. Clickea **"Create App"**
3. Selecciona **"Business"** como tipo
4. Completa información:
   - App Name: `shortlist-gt`
   - App Contact: tu email
   - App Purpose: `Business Tools`

### Paso 3.2: Configurar WhatsApp

1. En el dashboard de la app, clickea **"Add Products"**
2. Busca **"WhatsApp"**
3. Clickea **"Set Up"**
4. Selecciona **"Cloud API"**

### Paso 3.3: Obtener Credenciales

1. Clickea **"Settings"** → **"Basic"**
2. Copia:
   - **App ID**: (arriba)
   - **App Secret**: (arriba)

3. Clickea **"Settings"** → **"WhatsApp"** → **"Getting Started"**
4. Aquí recibirás:
   - **Business Account ID**: (generado)
   - **Phone Number ID**: (generado)
   - **Access Token**: (temporal, 24 horas)

Para obtener **Access Token permanente**:

1. Clickea **"System User Access Tokens"**
2. Crea nuevo token:
   - Duration: "Never expires"
   - Permissions: whatsapp_business_management, whatsapp_business_messaging
3. Copia el token

### Paso 3.4: Configurar Webhook

**Local (para testing):**
- URL: `http://localhost:3000/api/webhooks/whatsapp`
- Verify Token: `mi_token_secreto_seguro_123`

En Meta Developers:
1. Clickea **"Configuration"** en WhatsApp
2. Webhook URL: `http://localhost:3000/api/webhooks/whatsapp`
3. Verify Token: `mi_token_secreto_seguro_123`
4. Clickea **"Verify and Save"**

Deberías ver: "Webhook verified successfully"

### Paso 3.5: Actualizar .env.local

```env
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789
WHATSAPP_PHONE_NUMBER_ID=987654321
WHATSAPP_ACCESS_TOKEN=EAAx...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=mi_token_secreto_seguro_123
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

✅ **WhatsApp configurado (local)**

---

## 🧪 Testing de Credenciales

### Test 1: Supabase

```bash
cd "C:\Users\gabri\Desktop\Plataforma Web RR.HH\shortlist-gt"
npm run dev
```

Abre http://localhost:3000/auth/signup

- Crear usuario
- Deberías ver registro en Supabase console → SQL Editor → SELECT * FROM usuarios

### Test 2: OpenAI

```bash
# En otra terminal
curl -X POST http://localhost:3000/api/cv \
  -H "Content-Type: application/json" \
  -d '{
    "cvText": "Senior React developer with 5 years experience",
    "jobDescription": "We need a React expert",
    "candidatoId": "test-123"
  }'
```

Deberías recibir JSON con análisis de CV.

### Test 3: WhatsApp

```bash
# Verificar que webhook está configurado
curl "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=mi_token_secreto_seguro_123&hub.challenge=test_challenge"
```

Deberías recibir: `test_challenge`

---

## ✅ Checklist de Configuración

```
SUPABASE:
[ ] Proyecto creado
[ ] Schema SQL ejecutado
[ ] URL obtenida
[ ] Keys obtenidas
[ ] .env.local actualizado
[ ] Test signup funciona

OPENAI:
[ ] API key creada
[ ] .env.local actualizado
[ ] Test API funciona

WHATSAPP:
[ ] Business Account creado
[ ] Phone Number ID obtenido
[ ] Access Token obtenido
[ ] Webhook configurado
[ ] .env.local actualizado
[ ] Test webhook funciona
```

---

## 🚨 Troubleshooting

### Error: "Cannot connect to Supabase"
**Solución**: Verificar que NEXT_PUBLIC_SUPABASE_URL es correcto

### Error: "Invalid OpenAI key"
**Solución**: Verificar que OPENAI_API_KEY comienza con `sk-proj-`

### Error: "Webhook verification failed"
**Solución**: Verificar que WHATSAPP_WEBHOOK_VERIFY_TOKEN coincide en Meta y .env.local

### Error: "Email already registered"
**Solución**: Usar email diferente en test, o borrar usuario de Supabase

---

## 🎯 Siguientes Pasos

Una vez configurado todo:

1. ✅ Ir a PASO 2: Implementar procesamiento real de CVs
2. ✅ Ir a PASO 3: Integrar WhatsApp automático
3. ✅ Ir a PASO 4: Agregar más features
4. ✅ Ir a PASO 5: Deployment en Vercel

---

*Configuración de Credenciales - PASO 1*  
*Actualizado: 1 de Septiembre, 2026*
