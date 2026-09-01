# SHORTLIST.GT - Plataforma de Reclutamiento Inteligente

Una plataforma SaaS moderna para reclutamiento impulsada por IA, que utiliza análisis automático de CVs, WhatsApp Cloud API para comunicación y scoring inteligente de candidatos.

## 🚀 Características Principales

- **Análisis IA de CVs**: Procesa CVs con GPT-4 para extraer competencias y calcular match scores
- **Integración WhatsApp**: Comunicación automática con candidatos vía WhatsApp Cloud API
- **Scoring Automático**: Calificación basada en CV, videos de evaluación y respuestas a preguntas situacionales
- **Dashboard Premium**: Interfaz visual moderna inspirada en Linear.app y Vercel Dashboard
- **Sistema de Evaluación Multi-paso**: Confirmación → Grabación de Videos → Preguntas de Test
- **Gestión de Vacantes**: CRUD completo de posiciones abiertas con criterios específicos

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15, React 19, TypeScript
- **Estilos**: Tailwind CSS 4, Framer Motion, Lucide React
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **IA**: OpenAI GPT-4 (procesamiento de CVs)
- **Mensajería**: WhatsApp Cloud API
- **Almacenamiento**: Supabase Storage

## 📋 Estructura del Proyecto

```
shortlist-gt/
├── app/
│   ├── api/
│   │   ├── candidatos/postular/    # Endpoint para postulación
│   │   ├── cv/                      # Procesamiento IA de CVs
│   │   └── webhooks/whatsapp/       # Webhook de WhatsApp
│   ├── dashboard/
│   │   └── vacantes/[id]/           # Dashboard de reclutador
│   ├── postular/[slug]/             # Landing pública de candidatos
│   ├── globals.css                  # Estilos globales
│   ├── layout.tsx                   # Layout principal
│   └── page.tsx                     # Homepage
├── components/
│   ├── ui/                          # Componentes base
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── radial-gauge.tsx
│   ├── dashboard/                   # Componentes del dashboard
│   └── forms/                       # Formularios
├── lib/
│   └── supabase.ts                  # Configuración de Supabase
├── supabase/
│   └── schema.sql                   # Schema de base de datos
├── public/
│   └── uploads/                     # CVs subidos
├── .env.example                     # Plantilla de variables de entorno
├── .env.local                       # Variables locales (dev)
├── tailwind.config.ts               # Configuración Tailwind
└── tsconfig.json                    # Configuración TypeScript
```

## 🔧 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
cd "C:\Users\gabri\Desktop\Plataforma Web RR.HH\shortlist-gt"
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

Copia `.env.example` a `.env.local` y actualiza con tus credenciales:

```bash
cp .env.example .env.local
```

Luego edita `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-api-key

# WhatsApp
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-id
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-webhook-token

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. En el SQL Editor, ejecuta el contenido de `supabase/schema.sql`
3. Habilita Row Level Security (RLS) en todas las tablas

### 5. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📖 Guía de Uso

### Para Reclutadores

1. **Dashboard**: Accede a `/dashboard/vacantes/[id]` para ver candidatos
2. **Visualización**: Vista dividida con Top 3 candidatos a la izquierda y detalles a la derecha
3. **Scoring**: Radial gauge muestra el score total desglosado por categoría
4. **Acciones Rápidas**: Botones para agendar entrevistas o hacer ofertas

### Para Candidatos

1. **Postulación**: Acceden a `/postular/[slug]` con el slug de la vacante
2. **Carga de CV**: Drag & drop o selección de archivo PDF
3. **Datos Personales**: Nombre, email, teléfono WhatsApp, disponibilidad, expectativa salarial
4. **Evaluación WhatsApp**: Reciben automatización con preguntas, videos y test

## 🔌 API Endpoints

### POST `/api/candidatos/postular`
Registra un nuevo candidato con su CV

**Request:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "telefono": "+502 7123 4567",
  "disponibilidad": "Inmediata",
  "salario": "Q 40,000 - Q 50,000",
  "slug": "senior-react-dev",
  "cv": <File>
}
```

### POST `/api/cv`
Procesa el CV con IA y calcula score

**Request:**
```json
{
  "cvText": "...",
  "jobDescription": "...",
  "candidatoId": "uuid"
}
```

### GET/POST `/api/webhooks/whatsapp`
Webhook para recibir mensajes y eventos de WhatsApp

## 🗄️ Schema de Base de Datos

### Tablas Principales

- **usuarios**: Reclutadores y administradores
- **vacantes**: Posiciones abiertas
- **candidatos**: Perfiles de candidatos
- **evaluaciones_whatsapp**: Tracking del proceso de evaluación
- **archivos_cv**: Almacenamiento de CVs
- **logs_whatsapp**: Logs de interacciones

Todas las tablas tienen RLS configurado para seguridad.

## 🎨 Diseño y UX

- **Tema**: Dark mode (Zinc-950/Zinc-900 con acentos Emerald/Indigo)
- **Inspiración**: Linear.app, Vercel Dashboard, Raycast
- **Componentes**: Bordes sutiles, fondos con backdrop-blur, transiciones suaves
- **Iconografía**: Lucide React
- **Animaciones**: Framer Motion para micro-interacciones

## 🚀 Deployment

### Vercel (Recomendado)

```bash
npm run build
```

Luego sube a Vercel desde el repositorio Git.

### Variables de Entorno en Producción

Asegúrate de configurar todas las variables en Vercel Settings → Environment Variables.

## 📝 Próximos Pasos

- [ ] Integrar autenticación Supabase
- [ ] Procesar videos con IA (transcripción/análisis)
- [ ] Dashboard de analytics
- [ ] Sistema de notificaciones
- [ ] Integración con calendarios para agendar entrevistas
- [ ] Exportación de reportes
- [ ] Integración con LinkedIn
- [ ] Tests automatizados

## 📞 Soporte

Para reportar issues o sugerencias, contacta al equipo de desarrollo.

## 📄 Licencia

Todos los derechos reservados © 2024 SHORTLIST.GT
