# 🔧 Debugging & Fixes - SHORTLIST.GT

**Guía de troubleshooting y soluciones rápidas**

---

## 🚨 Errores Comunes y Soluciones

### Error 1: "Cannot find module '@supabase/supabase-js'"
**Causa**: Dependencias no instaladas  
**Solución**:
```bash
npm install
npm run build
```

### Error 2: "supabaseUrl is required"
**Causa**: Falta configuración de .env.local  
**Solución**:
```bash
# Copiar plantilla
cp .env.example .env.local

# Editar con tus credenciales
# NEXT_PUBLIC_SUPABASE_URL=tu_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key
```

### Error 3: "Port 3000 already in use"
**Causa**: Otro proceso está usando el puerto  
**Soluciones**:
```bash
# Opción 1: Usar otro puerto
npm run dev -- -p 3001

# Opción 2: Matar proceso en puerto 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :3000
kill -9 <PID>
```

### Error 4: "Failed to compile"
**Causa**: Error de TypeScript o sintaxis  
**Solución**:
```bash
npm run build 2>&1 | tail -50
# Ver el error específico y corregir
```

### Error 5: "Unauthorized" en API calls
**Causa**: Falta token Bearer o credenciales Supabase  
**Solución**:
```bash
# Verificar .env.local tiene:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Verificar que estés autenticado en la app
```

### Error 6: "OPENAI_API_KEY is invalid"
**Causa**: API key incorrecta o expirada  
**Solución**:
```bash
# Verificar que la key empiece con sk-
# Generar nueva key en https://platform.openai.com/api/keys
# Actualizar en .env.local
```

### Error 7: "Webhook verification failed"
**Causa**: Verify token no coincide  
**Solución**:
```bash
# En .env.local
WHATSAPP_WEBHOOK_VERIFY_TOKEN=mi_token_secreto

# En Meta Developers
# Webhook URL: https://yourapp.com/api/webhooks/whatsapp
# Verify Token: mi_token_secreto (DEBE SER IGUAL)
```

---

## 🐛 Debugging Técnicas

### 1. Ver Logs del Dev Server
```bash
npm run dev 2>&1 | tee dev.log
# Guarda logs en dev.log

# Ver logs en tiempo real
tail -f dev.log
```

### 2. Debugging de API Endpoints
```bash
# Endpoint simple
curl -v http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test&hub.challenge=test123

# Con JSON
curl -X POST http://localhost:3000/api/cv \
  -H "Content-Type: application/json" \
  -d '{"cvText":"test","jobDescription":"test"}' \
  -v
```

### 3. Inspeccionar Base de Datos
```bash
# En Supabase console
SELECT * FROM usuarios;
SELECT * FROM vacantes;
SELECT * FROM candidatos;
SELECT * FROM logs_whatsapp;
```

### 4. DevTools del Browser
```
F12 → Console:        Ver errores de JavaScript
F12 → Network:        Ver requests y responses
F12 → Storage:        Ver localStorage, sessionStorage
F12 → Application:    Ver service workers, manifests
```

### 5. Ver Variables de Entorno
```bash
# Verificar que están cargadas
echo $NEXT_PUBLIC_SUPABASE_URL
echo $OPENAI_API_KEY

# NO mostrar valores completos por seguridad
```

---

## 🔍 Problemas Específicos

### Problema: Signup no funciona
**Checklist**:
- [ ] ¿Supabase está configurado?
- [ ] ¿NEXT_PUBLIC_SUPABASE_URL es correcto?
- [ ] ¿NEXT_PUBLIC_SUPABASE_ANON_KEY es correcto?
- [ ] ¿Tabla usuarios existe en Supabase?
- [ ] ¿RLS policies están habilitadas?
- [ ] ¿Ver error en console del browser (F12)?

**Debug**:
```javascript
// En console del browser
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'Test123!',
});
console.log({ data, error });
```

### Problema: Dashboard muestra "Cargando..." eternamente
**Checklist**:
- [ ] ¿useAuth() hook está funcionando?
- [ ] ¿User está autenticado?
- [ ] ¿Datos se cargan desde API?
- [ ] ¿Ver errores en console (F12)?

**Debug**:
```javascript
// En console del browser
const user = await supabase.auth.getUser();
console.log('User:', user);
```

### Problema: CV processing falla
**Checklist**:
- [ ] ¿OPENAI_API_KEY está configurada?
- [ ] ¿Key es válida? (sk-proj-...)
- [ ] ¿Tiene crédito en OpenAI?
- [ ] ¿cvText no es vacío?
- [ ] ¿Ver error en server logs?

**Debug**:
```bash
curl -X POST http://localhost:3000/api/cv \
  -H "Content-Type: application/json" \
  -d '{
    "cvText":"Senior React Developer with 5 years experience",
    "jobDescription":"React Developer role",
    "candidatoId":"test-123"
  }' \
  -v
```

### Problema: WhatsApp no envía mensajes
**Checklist**:
- [ ] ¿WHATSAPP_ACCESS_TOKEN está configurada?
- [ ] ¿WHATSAPP_PHONE_NUMBER_ID es correcto?
- [ ] ¿WHATSAPP_BUSINESS_ACCOUNT_ID es correcto?
- [ ] ¿Token no expiró? (24 horas sin "Never expires")
- [ ] ¿Webhook verificado en Meta?

**Debug**:
```bash
# Test envío de mensaje
curl -X POST https://graph.instagram.com/v20.0/PHONE_NUMBER_ID/messages \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product":"whatsapp",
    "recipient_type":"individual",
    "to":"502XXXXXXXX",
    "type":"text",
    "text":{"body":"Test message"}
  }' \
  -v
```

---

## ✅ Verificación Rápida

### Verificar Build
```bash
npm run build
# Debe terminar sin errores
# Build time: <2s
# Routes: 14 total
```

### Verificar TypeScript
```bash
npm run build 2>&1 | grep -i "error"
# No debe haber output
```

### Verificar Dev Server
```bash
npm run dev &
sleep 2
curl -s http://localhost:3000 | grep -o "<title>.*</title>"
# Debe mostrar: <title>SHORTLIST.GT - Recruitment Platform</title>
```

### Verificar API Endpoint
```bash
curl -v http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=test&hub.challenge=abc123
# Debe retornar: abc123
```

---

## 🛠️ Fixes Comunes

### Fix 1: Limpiar node_modules
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Fix 2: Limpiar cache de Next.js
```bash
rm -rf .next
npm run build
```

### Fix 3: Reiniciar dev server
```bash
# Ctrl+C para detener
# Luego:
npm run dev
```

### Fix 4: Resetear variables de entorno
```bash
# Copiar nuevamente
cp .env.example .env.local
# Editar y agregar credenciales correctas
```

### Fix 5: Regenerar tipos de TypeScript
```bash
npm run build
# Genera .next/types automáticamente
```

---

## 📊 Performance Debugging

### Medir Load Time
```javascript
// En console del browser
performance.timing.loadEventEnd - performance.timing.navigationStart
// Tiempo total en ms
```

### Medir API Response Time
```bash
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/vacantes
```

### Ver Memory Usage
```bash
# En Node
node --inspect=9229 node_modules/.bin/next dev
# Abre chrome://inspect
```

---

## 🔐 Security Debugging

### Verificar que .env.local NO está en Git
```bash
git ls-files | grep env
# No debe mostrar .env.local
```

### Verificar credenciales en código
```bash
grep -r "sk-" app/ --include="*.ts" --include="*.tsx"
# No debe mostrar keys reales
```

### Verificar que RLS está habilitado
```bash
# En Supabase SQL Editor
SELECT * FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

---

## 📈 Monitoreo en Producción

### Vercel Logs
```bash
# Ver logs en Vercel
vercel logs
# O en: https://vercel.com/dashboard → tu-proyecto → Logs
```

### Sentry (si está configurado)
```
https://sentry.io → Tu organización → shortlist-gt
Ver errores y perf issues
```

### Supabase Analytics
```
https://supabase.com → Tu proyecto → Analytics
Ver queries, storage usage, API calls
```

---

## 🆘 Cuando Nada Funciona

### Nuclear Option (último recurso)
```bash
# 1. Limpiar todo
rm -rf node_modules package-lock.json .next .env.local

# 2. Reinstalar desde cero
npm install

# 3. Copiar .env
cp .env.example .env.local

# 4. Agregar credenciales reales a .env.local

# 5. Compilar
npm run build

# 6. Dev server
npm run dev
```

### Si aún no funciona
1. Revisar los últimos commits: `git log --oneline -10`
2. Ir a commit conocido como bueno: `git checkout <commit-hash>`
3. Rebuild: `npm install && npm run build`
4. Si funciona, revisar qué cambió después de ese commit

---

## 📞 Pedir Ayuda

Si nada de esto funciona:

1. **Recolecta información**:
   ```bash
   node --version
   npm --version
   cat .env.local | head -3  # NO mostrar valores completos
   npm run build 2>&1 | tail -50
   ```

2. **Describe el problema**:
   - Qué hiciste
   - Qué esperabas
   - Qué pasó
   - Error exacto (copiar del console)

3. **Comparte**:
   - Los logs de error
   - El contexto (¿acabas de clonar?, ¿acabas de actualizar?)

---

*Debugging & Fixes - SHORTLIST.GT*  
*Última actualización: 1 de Septiembre, 2026*
