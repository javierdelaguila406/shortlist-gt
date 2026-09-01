import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Zap, Brain, Users, Gauge } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950" style={{minHeight: '100vh', width: '100%'}}>
      {/* Navigation */}
      <nav className="border-b border-zinc-800/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-white">
            SHORTLIST<span className="text-emerald-500">.GT</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Button size="sm">Acceder</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Reclutamiento Inteligente
          <span className="block text-emerald-500">Impulsado por IA</span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
          Encuentra los mejores talentos 10x más rápido. SHORTLIST.GT utiliza IA para evaluar
          candidatos, WhatsApp para comunicación y análisis profundo de competencias.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/postular/sample">
            <Button size="lg" className="flex items-center gap-2">
              Postularme <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/dashboard/demo">
            <Button size="lg" variant="secondary">
              Probar Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white mb-12 text-center">
          Características Principales
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <Card>
            <CardHeader>
              <Brain className="w-8 h-8 text-emerald-500 mb-2" />
              <CardTitle className="text-lg">Análisis IA</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">
                Procesamos CVs con GPT-4 para extraer competencias y calcular match scores.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card>
            <CardHeader>
              <Zap className="w-8 h-8 text-indigo-500 mb-2" />
              <CardTitle className="text-lg">WhatsApp API</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">
                Comunicación automática con candidatos vía WhatsApp Cloud API.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card>
            <CardHeader>
              <Gauge className="w-8 h-8 text-amber-500 mb-2" />
              <CardTitle className="text-lg">Scoring Automático</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">
                Calificación automática basada en CV, videos y respuestas de tests.
              </p>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card>
            <CardHeader>
              <Users className="w-8 h-8 text-rose-500 mb-2" />
              <CardTitle className="text-lg">Dashboard Visual</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">
                Interfaz premium para gestionar candidatos y tomar decisiones rápido.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-zinc-800">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Stack Tecnológico</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { name: 'Next.js 15', desc: 'Frontend moderno' },
            { name: 'Supabase', desc: 'Base de datos' },
            { name: 'OpenAI GPT-4', desc: 'IA y análisis' },
            { name: 'WhatsApp API', desc: 'Mensajería' },
            { name: 'Tailwind CSS', desc: 'Estilos' },
            { name: 'TypeScript', desc: 'Type-safe' },
            { name: 'Framer Motion', desc: 'Animaciones' },
            { name: 'Lucide Icons', desc: 'Iconografía' },
          ].map((tech, i) => (
            <div key={i} className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/40">
              <p className="font-semibold text-white">{tech.name}</p>
              <p className="text-xs text-zinc-500 mt-1">{tech.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <Card className="bg-gradient-to-r from-emerald-950/20 to-indigo-950/20 border-emerald-800/40">
          <CardContent className="pt-12 pb-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              ¿Listo para revolucionar tu reclutamiento?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-xl mx-auto">
              Comienza hoy con un demo gratuito. No se requiere tarjeta de crédito.
            </p>
            <Button size="lg" className="flex items-center gap-2 mx-auto">
              Solicitar Demo <ArrowRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-zinc-500 text-sm">
          <p>© 2024 SHORTLIST.GT. Todos los derechos reservados.</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="#" className="hover:text-zinc-300 transition">
              Política de Privacidad
            </a>
            <a href="#" className="hover:text-zinc-300 transition">
              Términos de Servicio
            </a>
            <a href="#" className="hover:text-zinc-300 transition">
              Contacto
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
