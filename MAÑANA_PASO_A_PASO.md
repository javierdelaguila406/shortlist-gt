# 🌅 MAÑANA - PASOS SIMPLES (2 de Septiembre 2026)

**Tiempo Total: ~60 minutos**

---

## PASO 1️⃣ - VERIFICAR QUE TODO FUNCIONA (5 min)

```bash
# Abre PowerShell en esta carpeta:
# C:\Users\gabri\Desktop\Plataforma Web RR.HH\shortlist-gt

npm run dev

# Espera 30 segundos, luego abre:
# http://localhost:3000
```

**Checklist rápido**:
- [ ] Página carga (deberías ver el logo de SHORTLIST.GT)
- [ ] Puedes navegar sin errores
- [ ] No hay red error en la consola del browser (F12)

✅ Si todo funciona → Continúa con Paso 2

❌ Si hay errores → Lee `DEBUGGING_AND_FIXES.md`

---

## PASO 2️⃣ - COMPLETAR META FOR DEVELOPERS (20 min)

Abre: https://developers.facebook.com

**Escenario A - Si el SMS llega esta vez**:
1. Ingresa el código que recibiste por SMS
2. Haz clic en "Continuar" (o siguiente)
3. Completa "Contact info" (dirección, ciudad, etc.)
4. Completa "About you" (descripción)
5. Haz clic en "Completar registro"

**Escenario B - Si el SMS sigue sin llegar**:
1. Haz clic en "Actualizar número"
2. Intenta con otro número que reciba SMS
3. O contacta Meta support

✅ Sabrás que funcionó cuando veas el dashboard de Meta

---

## PASO 3️⃣ - CREAR APP EN META (10 min)

Una vez en el dashboard de Meta:

1. Busca "Apps" o "Crear aplicación"
2. Nombre: `SHORTLIST-GT`
3. Tipo: `Business`
4. Haz clic en "Crear"
5. Espera 30 segundos
6. ✅ Tendrás una App ID (guárdalo)

---

## PASO 4️⃣ - CONFIGURAR WHATSAPP (15 min)

En el dashboard de tu app (Meta):

1. Busca el lado izquierdo: "Productos" o "Add Product"
2. Busca y haz clic en **"WhatsApp"**
3. Haz clic en "Comenzar"
4. Selecciona "Business Account" (si te lo pregunta)
5. Sigue los pasos para conectar tu número de WhatsApp

**Qué necesitarás obtener**:
```
WHATSAPP_ACCESS_TOKEN = (long token string)
WHATSAPP_PHONE_NUMBER_ID = (números)
WHATSAPP_BUSINESS_ACCOUNT_ID = (números)
WHATSAPP_WEBHOOK_VERIFY_TOKEN = (crea uno: "mi_token_secreto")
```

Guarda estos valores en un archivo de texto temporalmente.

---

## PASO 5️⃣ - ACTUALIZAR .env.local (5 min)

Abre: `C:\Users\gabri\Desktop\Plataforma Web RR.HH\shortlist-gt\.env.local`

Reemplaza los placeholders:

```
# ANTES
WHATSAPP_BUSINESS_ACCOUNT_ID=placeholder
WHATSAPP_PHONE_NUMBER_ID=placeholder
WHATSAPP_ACCESS_TOKEN=placeholder
WHATSAPP_WEBHOOK_VERIFY_TOKEN=placeholder

# DESPUÉS (con tus valores)
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_ACCESS_TOKEN=EAADz2YuB8t4BAgZCxKvG7x...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=mi_token_secreto
```

Guarda el archivo (Ctrl+S)

---

## PASO 6️⃣ - REINICIAR DEV SERVER (5 min)

En la terminal donde está corriendo `npm run dev`:

1. Presiona: **Ctrl + C** (para detener)
2. Luego escribe: **npm run dev** (para reiniciar)
3. Espera 20 segundos
4. Verifica que no hay errores

---

## ✅ LISTO!

Cuando termines los 6 pasos:

✅ Supabase funciona
✅ OpenAI funciona
✅ WhatsApp está configurado
✅ App lista para producción

---

## 🆘 SI ALGO SALE MAL

| Problema | Solución |
|----------|----------|
| "Port 3000 already in use" | `npm run dev -- -p 3001` |
| "Cannot find module" | `npm install` |
| "API Key is invalid" | Verifica que copiaste bien el token |
| "WhatsApp not sending" | Verifica webhook en Meta dashboard |

Más soluciones en: `DEBUGGING_AND_FIXES.md`

---

## 📞 NOTAS IMPORTANTES

- No commitear `.env.local` (tiene credenciales reales)
- Siempre reiniciar dev server después de cambios en `.env`
- WhatsApp puede tardar 24hrs en activarse completamente
- Si Meta pide "Business Phone Number", usa el tuyo

---

**Tiempo estimado: 60 minutos**  
**Dificultad: Media**  
**Resultado final: App lista para producción** ✨

¡Que salga bien! 🚀
