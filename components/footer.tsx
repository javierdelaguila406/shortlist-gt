import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/50 bg-zinc-950/50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Branding */}
          <div>
            <h3 className="text-lg font-bold text-white mb-2">
              SHORTLIST<span className="text-emerald-500">.GT</span>
            </h3>
            <p className="text-sm text-zinc-400">
              Reclutamiento inteligente impulsado por IA
            </p>
          </div>

          {/* Producto */}
          <div>
            <h4 className="font-semibold text-white mb-4">Producto</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard/demo" className="text-sm text-zinc-400 hover:text-emerald-400 transition">
                  Demo
                </Link>
              </li>
              <li>
                <Link href="/postular/sample" className="text-sm text-zinc-400 hover:text-emerald-400 transition">
                  Postularse
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacidad" className="text-sm text-zinc-400 hover:text-emerald-400 transition">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="text-sm text-zinc-400 hover:text-emerald-400 transition">
                  Términos de Servicio
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contacto</h4>
            <ul className="space-y-2">
              <li>
                <a href="mailto:privacidad@shortlist.gt" className="text-sm text-zinc-400 hover:text-emerald-400 transition">
                  privacidad@shortlist.gt
                </a>
              </li>
              <li>
                <a href="mailto:legal@shortlist.gt" className="text-sm text-zinc-400 hover:text-emerald-400 transition">
                  legal@shortlist.gt
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-zinc-500">
              © 2024 SHORTLIST.GT. Todos los derechos reservados.
            </p>
            <p className="text-xs text-zinc-600 mt-4 md:mt-0">
              Hecho con ❤️ para revolucionar el reclutamiento
            </p>
          </div>
        </div>

        {/* Data Processing Notice */}
        <div className="mt-2 pt-2 border-t border-zinc-800/20">
          <p className="text-[0.65rem] text-zinc-600 text-center">
            ⚠️ Usamos IA para analizar CVs. <Link href="/privacidad" className="text-emerald-500 hover:text-emerald-400 underline">Política de Privacidad</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
