export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Política de Privacidad</h1>
          <p className="text-zinc-400">Efectiva desde: Septiembre de 2024 | Última actualización: Septiembre de 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-8 text-zinc-300">
          {/* Introducción */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Introducción</h2>
            <p className="mb-4">
              En <strong>SHORTLIST.GT</strong>, respetamos tu privacidad y nos comprometemos a proteger tus datos personales.
              Esta Política de Privacidad explica cómo recopilamos, utilizamos, compartimos y protegemos tu información cuando utilizas
              nuestro sitio web y servicios de reclutamiento inteligente.
            </p>
          </section>

          {/* Qué datos recolectamos */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Datos Personales que Recolectamos</h2>
            <p className="mb-4">Cuando te postulas a una vacante, recolectamos y procesamos los siguientes datos:</p>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-2">2.1 Datos de Identificación</h3>
                <ul className="list-disc list-inside text-zinc-400 space-y-1">
                  <li>Nombre completo</li>
                  <li>Correo electrónico</li>
                  <li>Número de teléfono WhatsApp</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">2.2 Datos Ocupacionales</h3>
                <ul className="list-disc list-inside text-zinc-400 space-y-1">
                  <li>Currículum Vitae (CV) en formato PDF</li>
                  <li>Expectativa salarial</li>
                  <li>Disponibilidad para trabajar</li>
                  <li>Videos de presentación (si se solicitan)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">2.3 Datos Técnicos</h3>
                <ul className="list-disc list-inside text-zinc-400 space-y-1">
                  <li>Dirección IP</li>
                  <li>Información del navegador</li>
                  <li>Timestamps de acceso</li>
                  <li>Cookies de sesión</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Uso de IA */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Procesamiento mediante Inteligencia Artificial</h2>
            <p className="mb-4">
              <strong>Transparencia en el uso de LLMs:</strong> Tu CV y respuestas serán procesados automáticamente por modelos de
              lenguaje (Large Language Models - LLMs) de <strong>OpenAI (GPT-4o-mini)</strong> para:
            </p>
            <div className="bg-yellow-950/30 border border-yellow-800/50 rounded-lg p-6 space-y-3">
              <ul className="list-disc list-inside text-zinc-300 space-y-2">
                <li>Extraer competencias técnicas y blandas</li>
                <li>Calcular un puntaje de compatibilidad (0-100)</li>
                <li>Generar análisis estructurado de tu perfil</li>
                <li>Proporcionar feedback automático sobre tu candidatura</li>
              </ul>
              <p className="text-sm text-zinc-400 mt-4">
                ⚠️ <strong>Nota importante:</strong> El procesamiento de IA es realizado por terceros especializados. No compartimos tu
                información personal con OpenAI más allá de lo necesario para este análisis.
              </p>
            </div>
          </section>

          {/* Terceros */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Terceros que Procesan tus Datos</h2>
            <p className="mb-4">Tus datos son procesados por los siguientes proveedores de servicios:</p>
            <div className="space-y-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <h3 className="font-semibold text-emerald-400 mb-2">Meta WhatsApp Cloud API</h3>
                <p className="text-sm text-zinc-400">
                  Utilizamos WhatsApp para comunicarnos contigo sobre el estado de tu postulación. Meta actúa como encargado de tratamiento
                  bajo los términos de sus políticas de privacidad.
                </p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <h3 className="font-semibold text-emerald-400 mb-2">OpenAI (Análisis de IA)</h3>
                <p className="text-sm text-zinc-400">
                  Tu CV es enviado a OpenAI para análisis de competencias mediante GPT-4o-mini. Los datos se procesan de acuerdo con
                  la política de privacidad de OpenAI y se eliminan después del análisis.
                </p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <h3 className="font-semibold text-emerald-400 mb-2">Supabase (Base de Datos)</h3>
                <p className="text-sm text-zinc-400">
                  Tus datos se almacenan en servidores de Supabase encriptados (AES-256) en data centers certificados ISO 27001.
                  Supabase es un encargado de tratamiento certificado.
                </p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <h3 className="font-semibold text-emerald-400 mb-2">Vercel (Hosting)</h3>
                <p className="text-sm text-zinc-400">
                  La plataforma se aloja en Vercel, que proporciona infraestructura segura y cumple con estándares SOC 2 Type II.
                  Los datos en tránsito están protegidos por TLS 1.3.
                </p>
              </div>
            </div>
          </section>

          {/* Base Legal */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Base Legal del Tratamiento</h2>
            <p className="mb-4">Procesamos tus datos con base en:</p>
            <ul className="list-disc list-inside text-zinc-400 space-y-2">
              <li><strong>Consentimiento explícito:</strong> Al marcar el checkbox en el formulario de postulación</li>
              <li><strong>Ejecución de contrato:</strong> Para procesar tu candidatura a la vacante</li>
              <li><strong>Interés legítimo:</strong> Mejorar nuestros servicios y prevenir fraude</li>
            </ul>
          </section>

          {/* Derechos del Titular */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Tus Derechos como Titular de Datos</h2>
            <p className="mb-4">Tienes los siguientes derechos bajo regulaciones de protección de datos (GDPR, LGPD, etc.):</p>
            <div className="space-y-3">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">📋 Derecho de Acceso</h3>
                <p className="text-sm text-zinc-400">Solicitar una copia de todos tus datos personales que almacenamos.</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">✏️ Derecho de Rectificación</h3>
                <p className="text-sm text-zinc-400">Corregir o actualizar información inexacta o incompleta.</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">🗑️ Derecho al Olvido (Eliminación)</h3>
                <p className="text-sm text-zinc-400">
                  Solicitar la eliminación completa de tus datos personales. Eliminaremos tu información en un plazo de 30 días
                  después de verificar tu identidad.
                </p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">🚫 Derecho de Oposición</h3>
                <p className="text-sm text-zinc-400">Oponerte al procesamiento de tus datos para fines de marketing o análisis.</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">📊 Derecho de Portabilidad</h3>
                <p className="text-sm text-zinc-400">Recibir tus datos en formato estructurado, legible y transferible.</p>
              </div>
            </div>
          </section>

          {/* Cómo Ejercer Derechos */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Cómo Ejercer tus Derechos</h2>
            <p className="mb-4">
              Para ejercer cualquiera de tus derechos, envía una solicitud por correo electrónico a:
            </p>
            <div className="bg-zinc-900/50 border border-emerald-800/50 rounded-lg p-6">
              <p className="font-mono text-emerald-400 text-center text-lg font-semibold">
                privacidad@shortlist.gt
              </p>
              <p className="text-sm text-zinc-400 text-center mt-4">
                Debes incluir tu nombre completo, correo de registro y una descripción clara de tu solicitud.
                Verificaremos tu identidad y responderemos en un plazo de 10 días hábiles.
              </p>
            </div>
          </section>

          {/* Retención de Datos */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Retención de Datos</h2>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 space-y-3">
              <p>Conservamos tus datos de acuerdo con los siguientes períodos:</p>
              <ul className="list-disc list-inside text-zinc-400 space-y-2">
                <li><strong>Datos de candidatura:</strong> 12 meses después de la postulación (o hasta que solicites su eliminación)</li>
                <li><strong>Datos de interacción WhatsApp:</strong> 6 meses después de la última comunicación</li>
                <li><strong>Logs técnicos:</strong> 3 meses para propósitos de seguridad y auditoría</li>
                <li><strong>Rechazados:</strong> 6 meses, luego eliminados automáticamente</li>
              </ul>
            </div>
          </section>

          {/* Seguridad */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Medidas de Seguridad</h2>
            <p className="mb-4">Implementamos las siguientes medidas para proteger tu información:</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">🔒 Encriptación</h3>
                <p className="text-sm text-zinc-400">AES-256 en reposo, TLS 1.3 en tránsito</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">🔑 Control de Acceso</h3>
                <p className="text-sm text-zinc-400">Autenticación multi-factor, RBAC granular</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">📋 Auditoría</h3>
                <p className="text-sm text-zinc-400">Logs de acceso, monitoreo de anomalías</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">🛡️ Cumplimiento</h3>
                <p className="text-sm text-zinc-400">ISO 27001, SOC 2 Type II, GDPR</p>
              </div>
            </div>
          </section>

          {/* Cambios */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Cambios en esta Política</h2>
            <p className="text-zinc-400">
              Podemos actualizar esta Política de Privacidad ocasionalmente. Publicaremos los cambios en esta página
              con una fecha de "Última actualización" revisada. Tu uso continuado del sitio constituye aceptación de los cambios.
            </p>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Contacto y Denuncias</h2>
            <p className="mb-4">
              Si tienes preguntas sobre esta política o deseas reportar una infracción de privacidad:
            </p>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 space-y-3">
              <p className="text-zinc-300">
                <strong>Email:</strong> <span className="text-emerald-400">privacidad@shortlist.gt</span>
              </p>
              <p className="text-zinc-300">
                <strong>También puedes denunciar ante la autoridad de protección de datos de tu país.</strong>
              </p>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-zinc-800">
            <p className="text-center text-sm text-zinc-500">
              © 2024 SHORTLIST.GT. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
