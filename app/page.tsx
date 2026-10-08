import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/brand';
import { ArrowRight, Zap, Brain, Users, Gauge } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: Brain,
    title: 'Análisis de CV',
    text: 'Comparamos cada CV con la descripción de la vacante y calculamos un puntaje de compatibilidad.',
  },
  {
    icon: Zap,
    title: 'Evaluaciones por enlace',
    text: 'Envía a cada candidato un enlace personal con su prueba y recibe el puntaje en tu panel.',
  },
  {
    icon: Gauge,
    title: 'Scoring automático',
    text: 'Calificación automática basada en el CV y en las respuestas de la evaluación.',
  },
  {
    icon: Users,
    title: 'Panel visual',
    text: 'Gestiona candidatos y toma decisiones rápido, con todo el proceso en una sola vista.',
  },
];

const stack = [
  { name: 'Next.js 16', desc: 'Frontend moderno' },
  { name: 'Supabase', desc: 'Base de datos' },
  { name: 'Tailwind CSS', desc: 'Estilos' },
  { name: 'TypeScript', desc: 'Type-safe' },
  { name: 'Motion', desc: 'Animaciones' },
  { name: 'Lucide', desc: 'Iconografía' },
];

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="sm">Acceder</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Reclutamiento inteligente, impulsado por IA
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground text-pretty">
            Encuentra los mejores talentos más rápido. Nuvora califica cada CV contra tu vacante y envía
            evaluaciones en línea a tus candidatos con un solo enlace.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/acceso">
              <Button size="lg">
                Acceder ahora <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="secondary">
                Inicia sesión
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-16">
          <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight">Características principales</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text }) => (
              <Card key={title} className="transition-all hover:-translate-y-px hover:border-foreground/15 hover:shadow-md">
                <CardHeader className="border-b-0 pb-2">
                  <Icon className="mb-2 size-5 text-muted-foreground" aria-hidden="true" />
                  <CardTitle className="text-base">{title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-sm text-muted-foreground text-pretty">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t py-16">
          <h2 className="mb-2 text-center text-2xl font-semibold tracking-tight">Stack tecnológico</h2>
          <p className="mb-8 text-center text-sm text-muted-foreground">Herramientas con las que está construida la plataforma</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {stack.map((tech) => (
              <div key={tech.name} className="rounded-2xl border bg-card p-4 text-center">
                <p className="text-sm font-semibold">{tech.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{tech.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16">
          <Card className="flex flex-col items-center gap-4 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-semibold tracking-tight text-balance">
              ¿Listo para mejorar tu reclutamiento?
            </h2>
            <p className="max-w-xl text-muted-foreground text-pretty">
              Comienza hoy con un demo gratuito. No se requiere tarjeta de crédito.
            </p>
            <Button size="lg" className="mt-2">
              Solicitar demo <ArrowRight className="size-4" />
            </Button>
          </Card>
        </section>
      </main>

      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center text-sm text-muted-foreground sm:px-6">
          <Logo className="text-base" />
          <p>© 2024 Nuvora. Todos los derechos reservados.</p>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="#" className="transition-colors hover:text-foreground">
              Política de privacidad
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Términos de servicio
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Contacto
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
