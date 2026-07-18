import { Shield, Lock, Eye, Database } from "lucide-react";
import Link from "next/link";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | Pomodoro Chibcha App",
  description: "Política de Privacidad para el uso de Pomodoro Chibcha App y sus integraciones con Google.",
  alternates: {
    canonical: "https://pomodoro.chibcha.club/privacy",
  },
  openGraph: {
    title: "Política de Privacidad | Pomodoro Chibcha App",
    description: "Política de Privacidad para el uso de Pomodoro Chibcha App y sus integraciones con Google.",
    url: "https://pomodoro.chibcha.club/privacy",
  },
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <Shield className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Política de Privacidad
          </h1>
          <p className="text-lg text-slate-400">
            Última actualización: 17 de julio de 2026
          </p>
        </div>

        <div className="space-y-12 backdrop-blur-xl bg-slate-900/50 p-8 md:p-12 rounded-3xl border border-slate-800 shadow-2xl">
          <section>
            <h2 className="text-2xl font-bold text-white flex items-center mb-4">
              <Eye className="w-6 h-6 mr-3 text-emerald-400" />
              1. Introducción
            </h2>
            <p className="leading-relaxed text-slate-300">
              Bienvenido a <strong>Pomodoro Chibcha App</strong>. Nos tomamos muy en serio su privacidad. 
              Esta aplicación está diseñada para ser su centro de comando de productividad definitivo, 
              combinando la técnica Pomodoro, música ambiental (Lofi, Clásica, Rock) pensada
              para el estudio profundo, y la integración centralizada de sus tareas y eventos desde 
              las plataformas de Google. Esta política explica cómo manejamos su información.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white flex items-center mb-4">
              <Database className="w-6 h-6 mr-3 text-blue-400" />
              2. Uso de Datos de Google (OAuth)
            </h2>
            <p className="leading-relaxed text-slate-300 mb-4">
              Nuestra aplicación utiliza Google OAuth para autenticar y centralizar su espacio de trabajo. 
              Solicitamos acceso a:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-slate-300">
              <li>
                <strong>Google Tasks</strong> (<code>auth/tasks</code>): Para mostrar, crear, marcar como completadas
                y organizar sus tareas dentro de nuestro panel unificado, permitiéndole gestionarlas sin salir del
                temporizador Pomodoro.
              </li>
              <li>
                <strong>Eventos de Google Calendar</strong> (<code>auth/calendar.events</code>): Para mostrar sus
                reuniones del día (&quot;Today&quot;) y de mañana (&quot;Tomorrow&quot;), registrar sesiones Pomodoro como eventos y
                pausar automáticamente la música ambiental cuando una reunión esté a punto de comenzar. No solicitamos
                acceso a la configuración ni a la compartición de sus calendarios.
              </li>
              <li>
                <strong>Perfil Básico:</strong> Obtenemos su nombre y correo electrónico únicamente para
                identificar su sesión de usuario y personalizar el tablero.
              </li>
            </ul>
            <p className="leading-relaxed text-slate-300 mt-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <strong>Nuestro Compromiso:</strong> No vendemos ni compartimos su información de Calendario o Tareas,
              y no la almacenamos en bases de datos propias. Sus peticiones se transmiten a través de nuestro servidor,
              que actúa únicamente como intermediario en tiempo real hacia las APIs de Google, sin guardar copias de
              sus datos. Sus datos de Google no se usan para publicidad ni se transfieren a terceros.
            </p>
            <p className="leading-relaxed text-slate-300 mt-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <strong>Uso Limitado (Limited Use):</strong> El uso que Pomodoro Chibcha App hace de la información
              recibida de las APIs de Google se adhiere a la{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 underline hover:text-emerald-300"
              >
                Política de Datos de Usuario de los Servicios API de Google
              </a>
              , incluidos los requisitos de Uso Limitado. <em>Pomodoro Chibcha App&apos;s use and transfer of
              information received from Google APIs to any other app will adhere to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 underline hover:text-emerald-300"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.</em>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white flex items-center mb-4">
              <Lock className="w-6 h-6 mr-3 text-purple-400" />
              3. Protección de la Información
            </h2>
            <p className="leading-relaxed text-slate-300">
              Nuestra arquitectura se basa en las mejores prácticas de seguridad de Next.js y NextAuth. 
              Los tokens de acceso otorgados por Google se manejan de manera segura con cifrado
              del lado del servidor y rotación automática (&quot;Refresh Token Rotation&quot;). No tenemos acceso
              a su contraseña de Google en ningún momento.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Retención y Eliminación de Datos</h2>
            <p className="leading-relaxed text-slate-300">
              Puesto que nuestra aplicación funciona como un portal (&quot;espejo&quot;) hacia su cuenta de Google,
              nosotros no retenemos un historial a largo plazo de sus tareas o reuniones. Los tokens de acceso
              se guardan cifrados en una cookie de sesión en su propio navegador y expiran automáticamente.
              Puede revocar el acceso de la aplicación en cualquier momento desde{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 underline hover:text-emerald-300"
              >
                los permisos de su cuenta de Google
              </a>
              ; al hacerlo, la aplicación pierde instantáneamente toda capacidad de ver o modificar sus datos.
              Cerrar sesión en la aplicación también elimina la cookie de sesión de su navegador.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Cookies y Analítica</h2>
            <p className="leading-relaxed text-slate-300">
              Utilizamos cookies estrictamente necesarias para mantener su sesión iniciada (gestionadas por
              NextAuth). Adicionalmente, usamos Google Analytics para obtener métricas de uso agregadas y
              anónimas (páginas visitadas, país, tipo de dispositivo) que nos ayudan a mejorar la aplicación.
              Google Analytics nunca recibe el contenido de sus tareas, eventos de calendario, ni sus tokens
              de acceso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Contacto</h2>
            <p className="leading-relaxed text-slate-300">
              Si tiene preguntas sobre esta política o sobre el manejo de sus datos, puede contactarnos a
              través de nuestro sitio principal en{" "}
              <a
                href="https://chibcha.club"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 underline hover:text-emerald-300"
              >
                chibcha.club
              </a>
              .
            </p>
          </section>

          <div className="pt-8 border-t border-slate-800 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              Volver al Tablero
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
