import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/brand';
import { ArrowRight, Zap, Brain, Users, Gauge } from 'lucide-react';
import Link from 'next/link';
import { RotatingWord } from '@/components/landing/rotating-word';
import { ScoreDemo } from '@/components/landing/score-demo';
import { ProcessSteps } from '@/components/landing/process-steps';
import { Bento } from '@/components/landing/bento';
import { Spotlight } from '@/components/landing/spotlight';
import { RobotBackground } from '@/components/landing/robot-background';
import { LogoScanner } from '@/components/landing/logo-scanner';

export default function Home() {
  return (
    <div className="min-h-screen w-full">
      <Spotlight />
      <RobotBackground />
      <div className="relative z-10">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/auth/login">
              <Button size="sm">Acceder</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="flex flex-col items-center gap-6 py-20 text-center sm:py-28">
          <LogoScanner />
          <h1 data-scan className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Reclutamiento inteligente para Guatemala
          </h1>
          <p className="flex flex-wrap items-baseline justify-center gap-x-2 text-lg text-muted-foreground">
            <span>Ordena, evalúa y contrata más rápido:</span>
            <RotatingWord words={['candidatos', 'vacantes', 'talento', 'tu equipo']} />
          </p>
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
          <h2 className="mb-2 text-center text-3xl font-semibold tracking-tight text-balance">Todo el reclutamiento, en una sola vista</h2>
          <p className="mb-10 text-center text-muted-foreground">Del primer CV a la decisión final, sin hojas de cálculo ni correos sueltos.</p>
          <Bento />
        </section>

        <section className="py-16">
          <h2 className="mb-2 text-center text-2xl font-semibold tracking-tight">Así se ve un ranking</h2>
          <p className="mb-8 text-center text-sm text-muted-foreground">Los candidatos se ordenan solos según su ajuste a la plaza.</p>
          <ScoreDemo />
        </section>

        <section className="border-t py-16">
          <h2 className="mb-2 text-center text-2xl font-semibold tracking-tight">Cómo funciona</h2>
          <p className="mb-10 text-center text-sm text-muted-foreground">Cinco pasos desde la vacante hasta la decisión.</p>
          <ProcessSteps />
        </section>


        <section className="py-16">
          <Card className="flex flex-col items-center gap-4 p-8 text-center sm:p-12">
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">Empieza hoy con Nuvora</h2>
            <p className="max-w-xl text-muted-foreground text-pretty">Instala la app en tu computadora o agenda una demo de 20 minutos.</p>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Link href="/auth/login">
                <Button size="lg">Instalar Nuvora <ArrowRight className="size-4" /></Button>
              </Link>
              <a href="mailto:nuvoratalentgt@outlook.com?subject=Demo%20de%20Nuvora">
                <Button size="lg" variant="secondary">Agendar una demo</Button>
              </a>
            </div>
          </Card>
        </section>
      </main>

      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center text-sm text-muted-foreground sm:px-6">
          <Logo className="text-base" />
          <p>© 2026 Nuvora. Todos los derechos reservados.</p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/privacidad" className="transition-colors hover:text-foreground">
              Política de privacidad
            </Link>
            <Link href="/terminos" className="transition-colors hover:text-foreground">
              Términos de servicio
            </Link>
            <a href="mailto:nuvoratalentgt@outlook.com" className="transition-colors hover:text-foreground">
              Contacto
            </a>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
