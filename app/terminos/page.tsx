export default function TerminosPage() {
  return (
    <div className="min-h-screen     text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-semibold text-foreground mb-4">Términos de Servicio</h1>
          <p className="text-muted-foreground">Efectivos desde: Septiembre de 2024 | Última actualización: Septiembre de 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-foreground">
          {/* Aceptación de Términos */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Aceptación de Términos</h2>
            <p className="mb-4">
              Al acceder y utilizar <strong>Nuvora</strong> (en adelante, &quot;la Plataforma&quot;), aceptas estar vinculado por estos
              Términos de Servicio. Si no aceptas estos términos, no debes utilizar la Plataforma.
            </p>
          </section>

          {/* Descripción del Servicio */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Descripción del Servicio</h2>
            <p className="mb-4">
              Nuvora es una plataforma de reclutamiento inteligente que:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Permite a candidatos postularse a vacantes</li>
              <li>Analiza CVs automáticamente comparándolos con la descripción de cada vacante</li>
              <li>Genera puntajes de compatibilidad automáticos</li>
              <li>Permite enviar evaluaciones en línea a los candidatos mediante un enlace personal</li>
              <li>Proporciona un dashboard para reclutadores</li>
            </ul>
          </section>

          {/* Uso Aceptable */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Uso Aceptable</h2>
            <p className="mb-4 font-semibold text-foreground">No puedes utilizar la Plataforma para:</p>
            <div className="space-y-3">
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                <ul className="list-disc list-inside text-foreground space-y-2">
                  <li>Enviar información falsa, fraudulenta o engañosa</li>
                  <li>Cargar malware, virus o código malintencionado</li>
                  <li>Intentar acceder sin autorización a sistemas o cuentas ajenas</li>
                  <li>Realizar ataques de denegación de servicio (DDoS)</li>
                  <li>Acoso, discriminación o lenguaje ofensivo</li>
                  <li>Violar leyes o derechos de terceros</li>
                  <li>Postularse múltiples veces a la misma vacante</li>
                  <li>Compartir credenciales de acceso</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Propiedad Intelectual */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Propiedad Intelectual</h2>
            <p className="mb-4">
              Todo contenido de la Plataforma (diseño, código, análisis de IA, algoritmos, logos, etc.) es propiedad intelectual
              de <strong>Nuvora</strong> o de sus licenciantes y está protegido por leyes de derechos de autor y marcas.
            </p>
            <p className="text-muted-foreground">
              Puedes usar la Plataforma únicamente para postularte a vacantes o gestionar candidaturas. No puedes reproducir,
              modificar, distribuir o crear obras derivadas sin consentimiento escrito.
            </p>
          </section>

          {/* Responsabilidades del Usuario */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Responsabilidades del Usuario</h2>
            <p className="mb-4">Eres responsable de:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Mantener la confidencialidad de tus credenciales de acceso</li>
              <li>Notificarnos inmediatamente de acceso no autorizado a tu cuenta</li>
              <li>Proporcionar información precisa y actualizada en tu perfil</li>
              <li>Cumplir con todas las leyes aplicables</li>
              <li>Respetar los derechos de otros usuarios</li>
            </ul>
          </section>

          {/* Limitación de Responsabilidad */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Limitación de Responsabilidad</h2>
            <p className="mb-4">
              <strong>LA PLATAFORMA SE PROPORCIONA &quot;TAL COMO ESTÁ&quot;</strong> sin garantías de ningún tipo, explícitas o implícitas.
            </p>
            <div className="bg-warning-soft border border-warning/30 rounded-lg p-6 space-y-3">
              <p className="font-semibold text-warning">Nuvora no garantiza:</p>
              <ul className="list-disc list-inside text-foreground space-y-2">
                <li>Que los puntajes de IA sean 100% precisos o definitivos</li>
                <li>Disponibilidad o funcionamiento ininterrumpido</li>
                <li>Que obtendrás una entrevista o oferta de empleo</li>
                <li>Que los reclutadores revisarán tu candidatura</li>
                <li>Ausencia de errores o interrupciones de servicio</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Los puntajes de compatibilidad son generados por IA y son únicamente una herramienta orientativa.
                La decisión final sobre candidatos es responsabilidad del reclutador.
              </p>
            </div>
          </section>

          {/* Exclusión de Daños */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Exclusión de Daños</h2>
            <p className="text-muted-foreground">
              EN NINGÚN CASO Nuvora SERÁ RESPONSABLE POR DAÑOS INDIRECTOS, INCIDENTALES, ESPECIALES, CONSECUENTES O PUNITIVOS,
              incluyendo pérdida de datos, ingresos, oportunidades de empleo o reputación, incluso si se ha informado de la posibilidad
              de tales daños.
            </p>
            <p className="mt-4 text-muted-foreground">
              La responsabilidad máxima de Nuvora no excederá el monto que hayas pagado (si aplica) en los últimos 12 meses.
            </p>
          </section>

          {/* Privacidad y Datos */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Privacidad y Tratamiento de Datos</h2>
            <p className="mb-4">
              El tratamiento de tus datos personales se rige por nuestra <strong>Política de Privacidad</strong>.
              Al usar la Plataforma, aceptas el procesamiento de tu información como se describe en dicha política.
            </p>
            <p className="text-muted-foreground">
              Entiendes que tu CV y tus respuestas a la evaluación serán analizados automáticamente por Nuvora para calcular
              puntajes orientativos, sin enviarlos a servicios externos de inteligencia artificial.
            </p>
          </section>

          {/* Modificación de Servicio */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Modificación de Servicio</h2>
            <p className="text-muted-foreground">
              Nos reservamos el derecho de modificar, suspender o descontinuar la Plataforma en cualquier momento sin previo aviso.
              También podemos actualizar estos términos. El uso continuado de la Plataforma constituye aceptación de los cambios.
            </p>
          </section>

          {/* Suspensión de Cuenta */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Suspensión o Cierre de Cuenta</h2>
            <p className="mb-4">
              Podemos suspender o cerrar tu cuenta sin previo aviso si:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Violas estos Términos o nuestra Política de Privacidad</li>
              <li>Proporcionas información falsa o fraudulenta</li>
              <li>Realizas actividades sospechosas o ilegales</li>
              <li>Incurres en acoso o conducta ofensiva</li>
              <li>No accedes a tu cuenta durante 24 meses consecutivos</li>
            </ul>
          </section>

          {/* Indemnización */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Indemnización</h2>
            <p className="text-muted-foreground">
              Aceptas indemnizar y defender a Nuvora, sus propietarios, empleados y agentes de cualquier reclamación,
              demanda, daño o gasto (incluyendo honorarios legales) que surja de tu violación de estos términos o tus acciones
              en la Plataforma.
            </p>
          </section>

          {/* Ley Aplicable */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Ley Aplicable y Jurisdicción</h2>
            <p className="text-muted-foreground">
              Estos Términos se rigen por las leyes de la República de Guatemala. Cualquier disputa será resuelta en los juzgados
              competentes de Guatemala, a menos que sea requerido por ley que se aplique otra jurisdicción.
            </p>
          </section>

          {/* Resolución de Conflictos */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">13. Resolución de Conflictos</h2>
            <p className="mb-4">
              Antes de iniciar procedimientos legales, intentaremos resolver cualquier disputa mediante negociación amistosa.
              Si no se resuelve en 30 días, cualquiera de las partes puede iniciar arbitraje vinculante.
            </p>
          </section>

          {/* Separabilidad */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">14. Separabilidad</h2>
            <p className="text-muted-foreground">
              Si alguna parte de estos Términos es declarada inválida o inaplicable, las demás disposiciones permanecerán en vigor.
            </p>
          </section>

          {/* Acuerdo Completo */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">15. Acuerdo Completo</h2>
            <p className="text-muted-foreground">
              Estos Términos de Servicio, junto con nuestra Política de Privacidad, constituyen el acuerdo completo entre tú y
              Nuvora y reemplazan todos los acuerdos anteriores.
            </p>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">16. Contacto</h2>
            <p className="mb-4">
              Si tienes preguntas sobre estos Términos de Servicio:
            </p>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-foreground">
                <strong>Email:</strong> <span className="text-brand">nuvoratalentgt@outlook.com</span>
              </p>
              <p className="text-foreground mt-2">
                <strong>Dirección:</strong> Guatemala City, Guatemala
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              © 2024 Nuvora. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
