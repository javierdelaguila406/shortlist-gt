import Link from 'next/link';

export default function HealthCheck() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-background px-4 py-10 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Servidor funcionando</h1>
        <p className="text-sm text-muted-foreground text-pretty">
          Si ves este mensaje, el servidor está respondiendo correctamente en tu móvil.
        </p>
      </div>

      <dl className="w-full max-w-md break-words rounded-2xl border bg-card p-5 text-left text-sm">
        <div className="flex flex-col gap-1 py-2">
          <dt className="font-medium">User agent</dt>
          <dd className="text-muted-foreground">{typeof navigator !== 'undefined' ? navigator.userAgent : 'No disponible'}</dd>
        </div>
        <div className="flex flex-col gap-1 py-2">
          <dt className="font-medium">Viewport</dt>
          <dd className="text-muted-foreground tabular-nums">
            {typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'No disponible'}
          </dd>
        </div>
        <div className="flex flex-col gap-1 py-2">
          <dt className="font-medium">Hora del servidor</dt>
          <dd className="text-muted-foreground tabular-nums">{new Date().toLocaleString()}</dd>
        </div>
      </dl>

      <Link
        href="/"
        className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Ir a la página principal
      </Link>
    </div>
  );
}
