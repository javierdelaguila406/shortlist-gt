# 📋 Guía de Compliance Legal y Protección de Datos

## 🔐 Cumplimiento Normativo de SHORTLIST.GT

Esta plataforma ha sido diseñada para cumplir con los siguientes estándares:

- ✅ **GDPR** (Reglamento General de Protección de Datos - UE)
- ✅ **LGPD** (Lei Geral de Proteção de Dados - Brasil)
- ✅ **Leyes de Protección de Datos** (Guatemala, El Salvador, Honduras, Nicaragua)
- ✅ **SOC 2 Type II** (Infraestructura)
- ✅ **ISO 27001** (Seguridad de la Información)

---

## 1️⃣ Derechos GDPR Implementados

### Derecho de Acceso (Art. 15)
**Endpoint:** `POST /api/candidatos/exportar`

Un candidato puede solicitar la exportación de todos sus datos personales en formato JSON:

```bash
curl -X POST https://shortlist-gt.vercel.app/api/candidatos/exportar \
  -H "Content-Type: application/json" \
  -d '{"email": "candidato@example.com"}'
```

**Respuesta:** Archivo JSON con todos los datos personales, análisis de IA y timestamps.

### Derecho al Olvido (Art. 17)
**Endpoint:** `DELETE /api/candidatos/eliminar`

Un candidato puede solicitar la eliminación permanente de sus datos:

```bash
curl -X DELETE https://shortlist-gt.vercel.app/api/candidatos/eliminar \
  -H "Content-Type: application/json" \
  -d '{"telefono": "+502 7123 4567"}'
```

**Qué se elimina:**
- Datos personales (nombre, email, teléfono)
- CV (archivo PDF de Supabase Storage)
- Videos (archivos de Supabase Storage)
- Registros de evaluación de IA
- Logs de comunicación

**Qué se retiene (por auditoría legal):**
- Log de eliminación con timestamp
- Razón de la eliminación
- IP de origen
- (Retención: 6 meses)

### Derecho de Rectificación (Art. 16)
Los candidatos pueden actualizar sus datos a través del formulario de postulación.

### Derecho de Portabilidad (Art. 20)
**Endpoint:** `POST /api/candidatos/exportar`

Los datos se exportan en formato JSON estructurado y máquina-legible.

---

## 2️⃣ Procesamiento de IA

### Transparencia en LLMs
Cada vez que se procesa un CV mediante IA:

1. **Log de Procesamiento**: Se registra en `logs_privacidad`
2. **Modelo Usado**: OpenAI GPT-4o-mini
3. **Datos Compartidos**: CV y respuestas de formulario
4. **Retención**: Se elimina después del análisis (máximo 30 días)

### Consentimiento Explícito
El formulario de postulación requiere checkbox obligatorio:

> ✓ "He leído y acepto la Política de Privacidad. Autorizo el contacto vía WhatsApp 
> y el procesamiento de mi CV mediante Inteligencia Artificial para esta vacante."

---

## 3️⃣ Tabla de Auditoría

### logs_privacidad
```sql
SELECT * FROM logs_privacidad WHERE timestamp > NOW() - INTERVAL '30 days';
```

**Campos registrados:**
- `accion`: EXPORTACION_DATOS, DERECHO_AL_OLVIDO, ELIMINACION
- `candidato_id`: ID del candidato afectado
- `timestamp`: Cuándo ocurrió
- `ip_origen`: De dónde se hizo la solicitud
- `motivo`: Razón legal de la acción

### Solicitudes Pendientes
```sql
SELECT * FROM solicitudes_olvido WHERE estado = 'pendiente';
```

---

## 4️⃣ Terceros y Encargados de Tratamiento

| Tercero | Función | Ubicación | Cumplimiento |
|---------|---------|-----------|--------------|
| **Supabase** | Base de datos + Storage | USA/EU | SOC 2, ISO 27001 |
| **OpenAI** | Análisis de IA | USA | Procesador certificado |
| **Meta/WhatsApp** | Comunicación vía SMS | USA | Encargado de tratamiento |
| **Vercel** | Hosting | Global (CDN) | SOC 2 Type II |

### Contratos de Encargado
Todos los terceros tienen firmados Data Processing Agreements (DPA).

---

## 5️⃣ Retención de Datos

| Dato | Período | Justificación |
|------|---------|---------------|
| CV/CV Analysis | 12 meses | Reclutamiento y referencia |
| Correos WhatsApp | 6 meses | Comunicación y seguimiento |
| Logs técnicos | 3 meses | Seguridad y debugging |
| Rechazados | 6 meses | Base de talentos futura |
| Logs auditoría | 6 meses | Compliance legal |

**Eliminación Automática:**
```sql
-- Se ejecuta cada 24 horas
DELETE FROM logs_privacidad 
WHERE timestamp < NOW() - INTERVAL '6 months';
```

---

## 6️⃣ Formulario de Consentimiento

### Campos Obligatorios ✓
- [x] Nombre completo
- [x] Email válido
- [x] Teléfono WhatsApp
- [x] Disponibilidad laboral
- [x] CV en PDF
- [x] **CHECKBOX: Aceptación de privacidad**

### Si No Se Marca el Checkbox
✗ El botón "Enviar Solicitud" está **deshabilitado**
✗ No se procesa la postulación

---

## 7️⃣ Notificaciones de Privacidad

### En Homepage
```
"Política de Privacidad | Términos de Servicio"
```

### En Footer (Todas las páginas)
```
⚠️ TRANSPARENCIA: Esta plataforma procesa tu CV mediante IA.
Lee nuestra Política de Privacidad...
```

### En Formulario de Postulación
```
"He leído y acepto la Política de Privacidad. Autorizo el procesamiento 
mediante IA y contacto por WhatsApp."
```

---

## 8️⃣ Cómo Responder a Solicitudes SARI

### SARI = Subject Access Request / Solicitud de Acceso

**Cuando recibas un email de privacidad@shortlist.gt:**

1. **Verificar identidad** (último 4 dígitos de teléfono, foto de ID)
2. **Ejecutar endpoint:**
   ```bash
   curl -X POST /api/candidatos/exportar \
     -d '{"email": "candidato@example.com"}'
   ```
3. **Responder en 10 días hábiles** con archivo JSON adjunto
4. **Registrar** en `solicitudes_olvido` con `estado = 'completado'`

---

## 9️⃣ Cómo Procesar Solicitudes de Derecho al Olvido

**Cuando recibas un email diciendo "Quiero que eliminen mis datos":**

1. **Verificar identidad** del candidato
2. **Confirmar solicitud** por email
3. **Ejecutar eliminación:**
   ```bash
   curl -X DELETE /api/candidatos/eliminar \
     -d '{"telefono": "+502 7123 4567"}'
   ```
4. **Confirmar completitud** al candidato en 30 días máximo
5. **Crear registro** en `solicitudes_olvido` con `estado = 'completado'`

---

## 🔟 Dashboard de Compliance

### Ver Acciones de Privacidad
```sql
SELECT 
  accion,
  COUNT(*) as total,
  MAX(timestamp) as ultima_accion
FROM logs_privacidad
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY accion
ORDER BY total DESC;
```

### Reporte de Cumplimiento
```sql
SELECT * FROM v_privacy_compliance;
```

### Solicitudes Pendientes
```sql
SELECT * FROM solicitudes_olvido 
WHERE estado IN ('pendiente', 'verificacion_pendiente');
```

---

## 1️⃣1️⃣ Checklist de Compliance

- [ ] Política de Privacidad publicada y accesible
- [ ] Términos de Servicio publicados
- [ ] Checkbox de consentimiento en formulario
- [ ] Footer con enlaces a legal en todas las páginas
- [ ] Endpoint `/api/candidatos/exportar` funcional
- [ ] Endpoint `/api/candidatos/eliminar` funcional
- [ ] Tabla `logs_privacidad` con auditoría
- [ ] Tabla `solicitudes_olvido` activa
- [ ] DPA firmados con terceros
- [ ] Política de retención en SQL
- [ ] Emails de privacidad configurados
- [ ] Personal capacitado en GDPR

---

## 1️⃣2️⃣ Contactos de Privacidad

**Encargado de Privacidad:**
📧 privacidad@shortlist.gt

**Contacto Legal:**
📧 legal@shortlist.gt

**Reportar Brecha de Seguridad:**
📧 seguridad@shortlist.gt

---

## 1️⃣3️⃣ Recursos Útiles

- [GDPR en 15 minutos](https://gdpr-info.eu/)
- [Checklist de Cumplimiento GDPR](https://ec.europa.eu/info/law/law-topic/data-protection/reform/rules-business-and-organisations/obligations/rights_en)
- [Documentación OpenAI Privacy](https://openai.com/policies/privacy-policy)
- [Supabase Security](https://supabase.com/security)

---

**Última actualización:** Septiembre 2024  
**Versión:** 1.0  
**Status:** ✅ En Compliance Total

