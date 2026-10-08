import Link from 'next/link';
import { Logo } from '@/components/brand';

export default function TestPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-10 bg-background px-4 py-10 text-center">
      <div className="flex flex-col items-center gap-3">
        <Logo className="text-2xl" />
        <p className="text-sm text-muted-foreground text-balance">Reclutamiento inteligente impulsado por IA</p>
      </div>

      <nav aria-label="Secciones de prueba" className="flex w-full max-w-xs flex-col gap-2">
        <Link href="/" className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          Inicio
        </Link>
        <Link href="/dashboard/demo" className="rounded-lg border bg-card px-5 py-3 text-sm font-medium transition-colors hover:bg-muted">
          Panel demo
        </Link>
        <Link href="/postular/sample" className="rounded-lg border bg-card px-5 py-3 text-sm font-medium transition-colors hover:bg-muted">
          Postularse
        </Link>
        <Link href="/auth/login" className="rounded-lg border bg-card px-5 py-3 text-sm font-medium transition-colors hover:bg-muted">
          Iniciar sesión
        </Link>
      </nav>

      <div className="max-w-sm rounded-2xl border bg-card p-5 text-xs text-muted-foreground">
        <p>✅ Si ves este mensaje, tu móvil está conectado correctamente.</p>
        <p className="mt-2">Haz clic en los botones para probar diferentes secciones.</p>
      </div>
    </div>
  );
}
