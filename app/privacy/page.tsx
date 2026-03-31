import { Shield, Lock, Eye, Database } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad | Pomodoro Chibcha App",
  description: "Política de Privacidad para el uso de Pomodoro Chibcha App y sus integraciones con Google.",
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
            Última actualización: {new Date().toLocaleDateString("es-CO")}
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
              combinando la técnica Pomodoro, música ambiental (Lofi, Clásica, Electrónica) pensada 
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
                <strong>Google Tasks:</strong> Para mostrar, marcar como completadas y organizar sus tareas 
                dentro de nuestro panel unificado, permitiéndole gestionarlas sin salir del temporizador Pomodoro.
              </li>
              <li>
                <strong>Google Calendar:</strong> Para mostrar sus reuniones del día ("Today") y de mañana ("Tomorrow"), 
                proporcionando alertas visuales y pausando automáticamente la música ambiental cuando una reunión 
                esté a punto de comenzar.
              </li>
              <li>
                <strong>Perfil Básico:</strong> Obtenemos su nombre y correo electrónico únicamente para 
                identificar su sesión de usuario y personalizar el tablero.
              </li>
            </ul>
            <p className="leading-relaxed text-slate-300 mt-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <strong>Compromiso Oculto:</strong> No vendemos, no compartimos, ni almacenamos en bases de datos propias 
              ajenas al funcionamiento en tiempo real, su información del Calendario o Tareas. Toda interacción ocurre 
              directamente entre su navegador y los servidores de Google.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white flex items-center mb-4">
              <Lock className="w-6 h-6 mr-3 text-purple-400" />
              3. Protección de la Información
            </h2>
            <p className="leading-relaxed text-slate-300">
              Nuestra arquitectura se basa en las mejores prácticas de seguridad de Next.js y NextAuth. 
              Los tokens de acceso otorgados por Google se manejan de manera segura con encripción 
              del lado del servidor y rotación automática ("Refresh Token Rotation"). No tenemos acceso 
              a su contraseña de Google en ningún momento.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Retención y Eliminación de Datos</h2>
            <p className="leading-relaxed text-slate-300">
              Puesto que nuestra aplicación funciona como un portal ("espejo") hacia su cuenta de Google, 
              nosotros no retenemos un historial a largo plazo de sus tareas o reuniones. Si decide 
              revocar el acceso desde su cuenta de Google, la aplicación perderá instantáneamente toda 
              capacidad de ver o modificar sus datos.
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
