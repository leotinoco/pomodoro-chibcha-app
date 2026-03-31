import { FileText, CheckCircle, AlertTriangle, Music } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Términos de Servicio | Pomodoro Chibcha App",
  description: "Términos y condiciones para el uso de Pomodoro Chibcha App.",
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <FileText className="w-16 h-16 text-blue-500 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Términos de Servicio
          </h1>
          <p className="text-lg text-slate-400">
            Última actualización: {new Date().toLocaleDateString("es-CO")}
          </p>
        </div>

        <div className="space-y-12 backdrop-blur-xl bg-slate-900/50 p-8 md:p-12 rounded-3xl border border-slate-800 shadow-2xl">
          <section>
            <h2 className="text-2xl font-bold text-white flex items-center mb-4">
              <CheckCircle className="w-6 h-6 mr-3 text-emerald-400" />
              1. Aceptación de los Términos
            </h2>
            <p className="leading-relaxed text-slate-300">
              Al acceder y utilizar <strong>Pomodoro Chibcha App</strong>, usted acepta estar sujeto a estos 
              Términos de Servicio. Si no está de acuerdo con alguna parte de los términos, no podrá acceder al servicio.
              Esta herramienta ha sido diseñada para optimizar su productividad y centralizar su trabajo.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white flex items-center mb-4">
              <Music className="w-6 h-6 mr-3 text-indigo-400" />
              2. Descripción del Servicio
            </h2>
            <p className="leading-relaxed text-slate-300 mb-4">
              Pomodoro Chibcha App proporciona un panel de productividad que integra:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-slate-300">
              <li>Gestión del tiempo mediante la técnica Pomodoro.</li>
              <li>Música ambiental y paisajes sonoros integrados para facilitar el estado de "Deep Work" o flujo de estudio.</li>
              <li>Sincronización en tiempo real con Google Tasks y Google Calendar para centralizar su información vital.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 mr-3 text-yellow-400" />
              3. Uso Aceptable e Integración con Google
            </h2>
            <p className="leading-relaxed text-slate-300">
              Al conectar su cuenta de Google, usted nos otorga permiso para interactuar con sus Tareas 
              y Calendario de acuerdo a las directrices establecidas en nuestra Política de Privacidad. 
              Usted es responsable de la información que decida visualizar y modificar a través 
              de nuestro panel. No proporcionamos ninguna garantía sobre la disponibilidad ininterrumpida 
              de las APIs de Google de las cuales dependemos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Propiedad Intelectual</h2>
            <p className="leading-relaxed text-slate-300">
              El diseño, la estética corporativa y el código fuente de la interfaz de Pomodoro Chibcha App 
              son propiedad de sus respectivos creadores. Los usuarios no tienen permitido copiar, modificar 
              o distribuir el diseño propietario de la interfaz sin consentimiento previo, aunque el código 
              funcional pueda estar sujeto a licencias Open Source (consulte nuestro repositorio en GitHub).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Descargo de Responsabilidad</h2>
            <p className="leading-relaxed text-slate-300">
              El servicio "Pomodoro Chibcha App" se proporciona "tal cual" y "según disponibilidad". 
              No garantizamos que el servicio será ininterrumpido, seguro o libre de errores. 
              No nos hacemos responsables por pérdida de tareas, citas perdidas derivadas de errores de 
              sincronización, o interrupciones en la música ambiental.
            </p>
          </section>

          <div className="pt-8 border-t border-slate-800 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Volver al Tablero
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
