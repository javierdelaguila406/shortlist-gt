# 🗄️ Configurar Tablas en Supabase - SHORTLIST.GT

## Pasos para Crear las Tablas en Supabase

### Paso 1: Abre Supabase
1. Abre tu navegador
2. Ve a: https://supabase.com
3. Inicia sesión con tu cuenta (si no lo hiciste ya)

### Paso 2: Accede a tu Proyecto
1. En el dashboard de Supabase, busca el proyecto **"shortlist-gt"**
2. Haz clic para abrirlo

### Paso 3: Abre SQL Editor
1. En la barra lateral izquierda, busca **"SQL Editor"**
2. Haz clic en **"New Query"** o **"+ New"**
3. Verás un editor de SQL en blanco

### Paso 4: Copia y Ejecuta el Script
1. Abre el archivo: `setup-database.sql` (está en el proyecto)
2. Copia TODO el contenido del archivo
3. Pégalo en el editor SQL de Supabase
4. Haz clic en el botón **"Run"** (o presiona Ctrl+Enter)

### Paso 5: Verifica que Funcionó
Deberías ver el mensaje:
```
"Database setup completed successfully!"
```

Si ves este mensaje, ¡las tablas están creadas!

---

## ✅ Qué se Creó

El script crea las siguientes tablas:
- **usuarios** - Para almacenar reclutadores/empresas
- **vacantes** - Para las ofertas de trabajo
- **candidatos** - Para los candidatos que aplican
- **logs_whatsapp** - Para historial de mensajes WhatsApp
- **analisis_cv** - Para resultados de análisis con IA

También crea:
- Índices para mejor performance
- Row Level Security (RLS) para seguridad
- Un usuario de demo: `javier.test@gmail.com`
- Una vacante de demo

---

## 🎯 Próximo Paso

Una vez que las tablas estén creadas, puedes:
1. Volver a http://localhost:3000
2. Intentar registrarte de nuevo con el email y contraseña
3. ¡Debería funcionar completamente!

---

## 🆘 Si Algo Sale Mal

**Si ves un error:**
1. Verifica que estés en el proyecto correcto ("shortlist-gt")
2. Revisa que el SQL sea idéntico (a veces hay caracteres especiales)
3. Intenta copiar y pegar el script nuevamente

**Si dice "table already exists":**
- Es normal, significa que las tablas ya se crearon
- Puedes ignorar ese error y continuar

---

**¡Listo! Tu base de datos está lista para SHORTLIST.GT**
