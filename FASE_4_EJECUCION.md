# 🎨 FASE 4 EJECUCIÓN - Interfaz y Accesibilidad

**Duración**: 4-6 horas  
**Criticidad**: P2  
**Estado**: ✅ LISTO - FASE 3 completada  
**Ejecutor**: ChatGPT  
**Auditor**: Claude Code  
**Parallelizable**: Con FASE 5 (Privacidad), no bloqueador para PROD

---

## 📊 RESUMEN

FASE 4 mejora UX y accesibilidad:
- Estados explícitos (cargando, error, vacío)
- Enlaces de vacantes funcionales (sin `undefined`)
- Accesibilidad básica (role, labels, keyboard, screen reader)
- Responsive y táctil (mobile, tablet, desktop)

**Items**: 4 (mejoras no críticas)  
**Prerequisito**: ✅ FASE 3 completada  
**Bloqueador para PROD**: NO (mejoras opcionales, pero recomendadas)

---

## ✅ ITEM 1: Estados Explícitos de Carga/Error (1.5 horas)

**Objetivo**: UI muestra qué está pasando (no silencio o "Sin datos" confuso)

**Archivos a revisar**:
- `app/dashboard/reclutador/page.tsx`
- `app/postular/[slug]/page.tsx`
- Componentes que usan `useEffect` + `useState`

**Patrones incorrectos** (❌):
```typescript
// MALO: Sin estado de carga
const [vacantes, setVacantes] = useState([]);

useEffect(() => {
  fetchVacantes().then(setVacantes);
}, []);

// Mientras carga, muestra [] vacío
return vacantes.length === 0 ? <div>Sin vacantes</div> : <List />;
// ❌ El usuario no sabe si está cargando o si realmente no hay datos
```

**Patrones correctos** (✅):
```typescript
const [vacantes, setVacantes] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  setLoading(true);
  setError(null);
  
  fetchVacantes()
    .then(setVacantes)
    .catch((err) => setError(err.message))
    .finally(() => setLoading(false));
}, []);

// Renderizar estados explícitos
if (loading) {
  return (
    <div className="flex items-center justify-center p-8">
      <Spinner />
      <span className="ml-2">Cargando vacantes...</span>
    </div>
  );
}

if (error) {
  return (
    <div className="bg-red-50 p-4 rounded text-red-600">
      Error: {error}
      <button onClick={() => window.location.reload()}>Reintentar</button>
    </div>
  );
}

if (vacantes.length === 0) {
  return (
    <div className="text-center p-8 text-gray-500">
      No hay vacantes disponibles
    </div>
  );
}

return <VacantesList vacantes={vacantes} />;
```

**Lugares a actualizar**:

1. **Dashboard reclutador** (`app/dashboard/reclutador/page.tsx`):
   - Cargar vacantes: mostrar "Cargando vacantes..."
   - Cargar candidatos: mostrar "Cargando candidatos..."
   - Errores de API: mostrar mensaje específico

2. **Página de postulación** (`app/postular/[slug]/page.tsx`):
   - Cargar vacante: mostrar "Cargando vacante..."
   - Validar vacante existe: mostrar "Vacante no encontrada"
   - Vacante cerrada: mostrar "Esta vacante cerró"

3. **Reportes**:
   - Cargar datos: mostrar "Generando reporte..."
   - Error en generación: mostrar "Falló al generar reporte"

**Pruebas**:

```
Test 1 - Estado de carga:
- Abrir dashboard
- Verificar que aparece "Cargando vacantes..."
- Después de 2-3 segundos, vacantes aparecen

Test 2 - Estado sin datos:
- Usuario sin vacantes
- Verificar: "No hay vacantes disponibles" (NO "Sin vacantes")

Test 3 - Estado de error (simular):
- Desconectar internet o usar Network Throttling en DevTools
- Verificar: Mensaje de error específico + botón "Reintentar"

Test 4 - Error 404 (vacante inexistente):
- Ir a /postular/id-inexistente
- Verificar: "Vacante no encontrada" con opción volver

Test 5 - Vacante cerrada:
- Crear vacante, cerrarla
- Ir a página de postulación
- Verificar: "Esta vacante cerró, no puedes postularte"
```

**Reporta**:
- ✅ Todos los estados muestran mensajes claros
- ✅ Spinner/loader visible mientras carga
- ✅ Errores muestran detalles específicos
- ✅ Mensajes coherentes en toda la app
- ❌ [Describe si algo falta]

---

## ✅ ITEM 2: Enlaces de Vacantes Funcionales (45 minutos)

**Objetivo**: Links a vacantes siempre funcionan (sin `undefined`)

**Defecto común**: "Ver link" muestra URL vacía

**Cambio requerido**:

```typescript
// MALO:
const vacuumUrl = vacante.link_recalculado; // ❌ puede ser undefined

// BUENO:
const vacuumUrl = `/postular/${vacante.id}`;

// Usar siempre ID como source of truth
```

**Archivos a revisar**:
- Cualquier lugar que muestre "Ver link" o genere enlace de vacante
- Dashboard reclutador: tabla de vacantes
- Componentes de tarjeta de vacante

**Implementación**:

```typescript
// En componente de tarjeta/fila de vacante
export function VacanteCard({ vacante }) {
  // SIEMPRE derivar URL desde ID
  const postulationLink = `/postular/${vacante.id}`;
  
  return (
    <div>
      <h3>{vacante.titulo}</h3>
      <p>{vacante.descripcion}</p>
      
      {/* Link funcional */}
      <a
        href={postulationLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        Ver vacante y postularse →
      </a>

      {/* Copiar link */}
      <button
        onClick={() => navigator.clipboard.writeText(
          `${window.location.origin}${postulationLink}`
        )}
        className="ml-4 text-sm"
      >
        Copiar link
      </button>
    </div>
  );
}
```

**Pruebas**:

```
Test 1 - Link válido:
- Crear vacante
- Dashboard muestra link: /postular/[id-real]
- Click abre página de postulación

Test 2 - Copiar link:
- Click en "Copiar link"
- Pegar en navegador → funciona

Test 3 - Link compartido:
- Copiar link completo: https://app.com/postular/[id]
- Compartir en Slack/email
- Click en link abierto → funciona

Test 4 - Actualizar vacante:
- Cambiar título
- Link sigue siendo /postular/[id-mismo]
- NO cambia a undefined

Test 5 - Ver vacante desde otro usuario:
- Crear vacante como usuario A
- Usar link en navegador privado
- Usuario B puede ver vacante
```

**Validación en código**:
- ❌ NO debe haber `vacante.link_recalculado` como source of truth
- ✅ DEBE ser siempre: `postulationLink = /postular/${vacante.id}`

**Reporta**:
- ✅ Links derivados siempre desde ID
- ✅ Ningún `undefined` en URLs
- ✅ Links compartibles funcionan
- ❌ [Describe si algo falla]

---

## ✅ ITEM 3: Accesibilidad Básica (1.5 horas)

**Objetivo**: App es usable con teclado y lector de pantalla

**Cambios requeridos**:

### 3.1 Roles y labels

```typescript
// Modal
<div role="dialog" aria-labelledby="modal-title" aria-hidden={!isOpen}>
  <h2 id="modal-title">Crear vacante</h2>
  {/* contenido */}
</div>

// Inputs con labels
<label htmlFor="titulo">Título de la vacante</label>
<input id="titulo" type="text" />

// NO:
<input type="text" placeholder="Título" /> ❌ (solo placeholder no es suficiente)

// Botones descriptivos
<button aria-label="Cerrar modal">×</button> // ✅
<button>×</button> // ❌ (sin aria-label para iconos)
```

### 3.2 Navegación con teclado

```typescript
// Escape cierra modal
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  if (isOpen) {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }
}, [isOpen]);
```

### 3.3 Foco inicial en modal

```typescript
// Cuando modal abre, foco va a primer input
useEffect(() => {
  if (isOpen) {
    firstInputRef.current?.focus();
  }
}, [isOpen]);

return (
  <input ref={firstInputRef} placeholder="Título" />
);
```

**Archivos a revisar**:
- `components/*Modal.tsx`
- `components/*Form.tsx`
- `app/dashboard/**/*.tsx`

**Pruebas**:

```
Test 1 - Tab navigation:
- Abrir página
- Presionar Tab repetidamente
- Verificar que todos los botones/inputs son alcanzables
- Orden es lógico (izquierda→derecha, arriba→abajo)

Test 2 - Enter en inputs:
- Completar formulario con Tab
- Presionar Enter en último input
- Esperado: Formulario enviado (o Tab a siguiente elemento)

Test 3 - Escape cierra modal:
- Abrir modal (crear vacante, etc.)
- Presionar Escape
- Modal cierra

Test 4 - Screen reader (VoiceOver en Mac o NVDA en Windows):
- Abrir DevTools
- Activar screen reader
- Navegar por página
- Debe escuchar:
  - Labels de inputs ("Título de la vacante", etc.)
  - Descripción de botones ("Enviar", "Cancelar", etc.)
  - Estados de radio/checkbox

Test 5 - Tab order en modal:
- Abrir modal
- Presionar Tab
- Foco está en primer input
- Presionar Tab N veces
- Foco vuelve al botón "Cancelar" (último elemento)
- Presionar Tab otra vez → vuelve al primer input (ciclado)

Test 6 - Aria labels en iconos:
- Iconos sin texto (× para cerrar, → para siguiente, etc.)
- Cada uno tiene aria-label descriptivo
```

**Validación automática**:

```bash
# Instalar axe DevTools (Chrome extension)
# Ir a cada página, abrir DevTools → Axe
# Escanear página
# Resultado esperado: 0 violaciones críticas

# O usar línea de comandos:
npm install --save-dev axe-core
npm test -- --coverage accessibility
```

**Reporta**:
- ✅ Navegación con Tab funciona en todas las páginas
- ✅ Escape cierra modales
- ✅ Labels asociados a inputs
- ✅ Aria-labels en iconos
- ✅ Screen reader detecta elementos
- ✅ 0 violaciones axe en páginas críticas
- ❌ [Describe si algo falla]

---

## ✅ ITEM 4: Responsive y Táctil (1.5 horas)

**Objetivo**: App funciona en 320px (mobile) hasta 1024px (tablet)

**Pruebas en DevTools**:

```
Test 1 - Mobile 375x812 (iPhone):
- Abrir DevTools → Device Toggle
- Seleccionar "iPhone 12"
- Verificar:
  ✅ Texto legible (no zoom requerido)
  ✅ Botones ≥ 44x44 px (táctil)
  ✅ Sin scroll horizontal
  ✅ Imágenes no desbordan
  ✅ Formularios funcionales (inputs accesibles)

Test 2 - Tablet 768x1024 (iPad):
- DevTools → "iPad Pro"
- Verificar layout se adapta (columnas, si aplica)

Test 3 - Desktop 1024x768+:
- DevTools → "Desktop"
- Layout optimizado para ancho

Test 4 - Tamaño de fuente:
- Mínimo 16px en inputs (previene zoom automático en iOS)
- Legible sin ampliar

Test 5 - Espacio entre elementos táctiles:
- Botones/links: espaciado ≥ 44x44 px
- Distancia entre botones: ≥ 8px

Test 6 - Orientación (landscape vs portrait):
- Rotar teléfono en DevTools
- Layout se ajusta sin desbordamiento
```

**Checklist CSS**:

```css
/* ✅ Responsive unit */
.button {
  padding: 0.75rem 1rem; /* relativo a font-size */
  min-width: 44px;
  min-height: 44px;
}

/* ✅ Mobile first */
@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ✅ Viewport meta tag */
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

/* ✅ Touch-friendly tap target */
.icon-button {
  min-width: 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Pruebas de regresión** (en DevTools):

```
- 320px: Sin desbordamiento horizontal
- 375px (mobile): Botones táctiles
- 640px (tablet small): 2 columnas
- 768px (tablet): Layout optimizado
- 1024px (desktop): 3 columnas

Verificar en todas las páginas principales:
- /auth/login
- /dashboard/reclutador
- /postular/[slug]
- /reportes
```

**Reporta**:
- ✅ Mobile (375px): funcional, sin desbordamiento
- ✅ Tablet (768px): layout adaptado
- ✅ Desktop (1024px+): optimizado
- ✅ Botones ≥ 44x44 px
- ✅ Fuente mínimo 16px en inputs
- ✅ Orientación portrait/landscape funciona
- ❌ [Describe si algo falla]

---

## 🎯 REPORTE FINAL FASE 4

```
FASE 4 COMPLETADA

ITEM 1: Estados explícitos        [✅ / ❌]
ITEM 2: Enlaces de vacantes       [✅ / ❌]
ITEM 3: Accesibilidad básica      [✅ / ❌]
ITEM 4: Responsive y táctil       [✅ / ❌]

RESUMEN: [✅ TODOS COMPLETOS] o [❌ PENDIENTES: ___]

Validaciones:
✅ Tests pasan
✅ TypeScript sin errores
✅ ESLint archivos modificados
✅ Build de producción exitoso
✅ Axe DevTools: 0 violaciones críticas (si aplica)

Si TODO está ✅:
Confirma que estás listo para que Claude haga commit + push + FASE 5
```

---

**Documento**: FASE 4 Ejecución  
**Duración**: 4-6 horas  
**Prerequisito**: FASE 3 ✅ completada  
**Parallelizable**: Con FASE 5 (Privacidad)  
**Bloqueador para PROD**: NO (mejoras UX, no críticas)  
**Estado**: 🚀 LISTO PARA EJECUTAR
