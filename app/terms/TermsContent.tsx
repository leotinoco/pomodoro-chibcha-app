"use client";

import { useState } from "react";
import { FileText, CheckCircle, AlertTriangle, Music, Globe } from "lucide-react";
import Link from "next/link";

type Lang = "es" | "en" | "fr" | "ja" | "pt";

const LANGS: { code: Lang; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ja", label: "日本語" },
  { code: "pt", label: "Português" },
];

type TermsCopy = {
  title: string;
  lastUpdated: string;
  acceptance: { title: string; body: string };
  service: { title: string; intro: string; items: string[] };
  google: { title: string; body: string };
  ip: { title: string; body: string };
  disclaimer: { title: string; body: string };
  discrepancyNote: string;
  backToDashboard: string;
};

const COPY: Record<Lang, TermsCopy> = {
  es: {
    title: "Términos de Servicio",
    lastUpdated: "Última actualización: 17 de julio de 2026",
    acceptance: {
      title: "1. Aceptación de los Términos",
      body: 'Al acceder y utilizar Pomodoro Chibcha App, usted acepta estar sujeto a estos Términos de Servicio. Si no está de acuerdo con alguna parte de los términos, no podrá acceder al servicio. Esta herramienta ha sido diseñada para optimizar su productividad y centralizar su trabajo.',
    },
    service: {
      title: "2. Descripción del Servicio",
      intro: "Pomodoro Chibcha App proporciona un panel de productividad que integra:",
      items: [
        "Gestión del tiempo mediante la técnica Pomodoro.",
        'Música ambiental y paisajes sonoros integrados para facilitar el estado de "Deep Work" o flujo de estudio.',
        "Sincronización en tiempo real con Google Tasks y Google Calendar para centralizar su información vital.",
      ],
    },
    google: {
      title: "3. Uso Aceptable e Integración con Google",
      body: "Al conectar su cuenta de Google, usted nos otorga permiso para interactuar con sus Tareas y Calendario de acuerdo a las directrices establecidas en nuestra Política de Privacidad. Usted es responsable de la información que decida visualizar y modificar a través de nuestro panel. No proporcionamos ninguna garantía sobre la disponibilidad ininterrumpida de las APIs de Google de las cuales dependemos.",
    },
    ip: {
      title: "4. Propiedad Intelectual",
      body: "El diseño, la estética corporativa y el código fuente de la interfaz de Pomodoro Chibcha App son propiedad de sus respectivos creadores. Los usuarios no tienen permitido copiar, modificar o distribuir el diseño propietario de la interfaz sin consentimiento previo, aunque el código funcional pueda estar sujeto a licencias Open Source (consulte nuestro repositorio en GitHub).",
    },
    disclaimer: {
      title: "5. Descargo de Responsabilidad",
      body: 'El servicio "Pomodoro Chibcha App" se proporciona "tal cual" y "según disponibilidad". No garantizamos que el servicio será ininterrumpido, seguro o libre de errores. No nos hacemos responsables por pérdida de tareas, citas perdidas derivadas de errores de sincronización, o interrupciones en la música ambiental.',
    },
    discrepancyNote:
      "En caso de discrepancia entre las traducciones, prevalecerá la versión en español.",
    backToDashboard: "Volver al Tablero",
  },
  en: {
    title: "Terms of Service",
    lastUpdated: "Last updated: July 17, 2026",
    acceptance: {
      title: "1. Acceptance of the Terms",
      body: "By accessing and using Pomodoro Chibcha App, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service. This tool has been designed to optimize your productivity and centralize your work.",
    },
    service: {
      title: "2. Description of the Service",
      intro: "Pomodoro Chibcha App provides a productivity dashboard that integrates:",
      items: [
        "Time management using the Pomodoro technique.",
        'Built-in ambient music and soundscapes to help you reach a "Deep Work" or study-flow state.',
        "Real-time synchronization with Google Tasks and Google Calendar to centralize your essential information.",
      ],
    },
    google: {
      title: "3. Acceptable Use and Google Integration",
      body: "By connecting your Google account, you grant us permission to interact with your Tasks and Calendar in accordance with the guidelines set out in our Privacy Policy. You are responsible for the information you choose to view and modify through our dashboard. We make no guarantee regarding the uninterrupted availability of the Google APIs we depend on.",
    },
    ip: {
      title: "4. Intellectual Property",
      body: "The design, brand aesthetics, and interface source code of Pomodoro Chibcha App are the property of their respective creators. Users are not permitted to copy, modify, or distribute the proprietary interface design without prior consent, although the functional code may be subject to Open Source licenses (see our GitHub repository).",
    },
    disclaimer: {
      title: "5. Disclaimer",
      body: 'The "Pomodoro Chibcha App" service is provided "as is" and "as available". We do not guarantee that the service will be uninterrupted, secure, or error-free. We are not responsible for lost tasks, missed appointments resulting from synchronization errors, or interruptions in the ambient music.',
    },
    discrepancyNote:
      "In case of any discrepancy between translations, the Spanish version shall prevail.",
    backToDashboard: "Back to Dashboard",
  },
  fr: {
    title: "Conditions d'Utilisation",
    lastUpdated: "Dernière mise à jour : 17 juillet 2026",
    acceptance: {
      title: "1. Acceptation des Conditions",
      body: "En accédant à Pomodoro Chibcha App et en l'utilisant, vous acceptez d'être lié par les présentes Conditions d'Utilisation. Si vous n'êtes pas d'accord avec une partie de ces conditions, vous ne pouvez pas accéder au service. Cet outil a été conçu pour optimiser votre productivité et centraliser votre travail.",
    },
    service: {
      title: "2. Description du Service",
      intro: "Pomodoro Chibcha App fournit un tableau de bord de productivité qui intègre :",
      items: [
        "La gestion du temps grâce à la technique Pomodoro.",
        "Une musique d'ambiance et des paysages sonores intégrés pour favoriser le « Deep Work » ou la concentration d'étude.",
        "La synchronisation en temps réel avec Google Tasks et Google Calendar pour centraliser vos informations essentielles.",
      ],
    },
    google: {
      title: "3. Utilisation Acceptable et Intégration Google",
      body: "En connectant votre compte Google, vous nous autorisez à interagir avec vos Tâches et votre Calendrier conformément aux directives établies dans notre Politique de Confidentialité. Vous êtes responsable des informations que vous choisissez de consulter et de modifier via notre tableau de bord. Nous ne garantissons pas la disponibilité ininterrompue des API de Google dont nous dépendons.",
    },
    ip: {
      title: "4. Propriété Intellectuelle",
      body: "Le design, l'esthétique de marque et le code source de l'interface de Pomodoro Chibcha App sont la propriété de leurs créateurs respectifs. Les utilisateurs ne sont pas autorisés à copier, modifier ou distribuer le design propriétaire de l'interface sans consentement préalable, bien que le code fonctionnel puisse être soumis à des licences Open Source (consultez notre dépôt GitHub).",
    },
    disclaimer: {
      title: "5. Clause de Non-Responsabilité",
      body: "Le service « Pomodoro Chibcha App » est fourni « tel quel » et « selon disponibilité ». Nous ne garantissons pas que le service sera ininterrompu, sécurisé ou exempt d'erreurs. Nous déclinons toute responsabilité en cas de perte de tâches, de rendez-vous manqués dus à des erreurs de synchronisation ou d'interruptions de la musique d'ambiance.",
    },
    discrepancyNote:
      "En cas de divergence entre les traductions, la version espagnole prévaudra.",
    backToDashboard: "Retour au Tableau de Bord",
  },
  ja: {
    title: "利用規約",
    lastUpdated: "最終更新日:2026年7月17日",
    acceptance: {
      title: "1. 規約への同意",
      body: "Pomodoro Chibcha Appにアクセスし利用することにより、お客様は本利用規約に拘束されることに同意したものとみなされます。規約のいずれかの部分に同意されない場合は、本サービスをご利用いただけません。本ツールは、お客様の生産性を最適化し、作業を一元化するために設計されています。",
    },
    service: {
      title: "2. サービスの説明",
      intro: "Pomodoro Chibcha Appは、以下を統合した生産性ダッシュボードを提供します:",
      items: [
        "ポモドーロ・テクニックによる時間管理。",
        "「ディープワーク」や学習への集中を促す、内蔵のアンビエント音楽とサウンドスケープ。",
        "Google TasksおよびGoogleカレンダーとのリアルタイム同期による重要な情報の一元管理。",
      ],
    },
    google: {
      title: "3. 利用規範とGoogle連携",
      body: "Googleアカウントを接続することにより、お客様は当社のプライバシーポリシーに定められたガイドラインに従って、お客様のタスクおよびカレンダーとやり取りする権限を当社に付与するものとします。ダッシュボードを通じて閲覧・変更する情報については、お客様ご自身の責任となります。当社が依存するGoogle APIが中断なく利用できることについて、当社は一切の保証を行いません。",
    },
    ip: {
      title: "4. 知的財産権",
      body: "Pomodoro Chibcha Appのデザイン、ブランドイメージ、およびインターフェースのソースコードは、それぞれの制作者に帰属します。機能的なコードはオープンソースライセンスの対象となる場合がありますが(GitHubリポジトリをご覧ください)、事前の同意なくインターフェース独自のデザインを複製、改変、配布することは許可されていません。",
    },
    disclaimer: {
      title: "5. 免責事項",
      body: "「Pomodoro Chibcha App」のサービスは「現状のまま」かつ「提供可能な範囲で」提供されます。サービスが中断されないこと、安全であること、エラーがないことは保証いたしません。同期エラーによるタスクの喪失や予定の見逃し、アンビエント音楽の中断について、当社は責任を負いません。",
    },
    discrepancyNote: "翻訳間に相違がある場合は、スペイン語版が優先されます。",
    backToDashboard: "ダッシュボードに戻る",
  },
  pt: {
    title: "Termos de Serviço",
    lastUpdated: "Última atualização: 17 de julho de 2026",
    acceptance: {
      title: "1. Aceitação dos Termos",
      body: "Ao acessar e utilizar o Pomodoro Chibcha App, você concorda em ficar vinculado a estes Termos de Serviço. Se você não concordar com qualquer parte dos termos, não poderá acessar o serviço. Esta ferramenta foi projetada para otimizar sua produtividade e centralizar seu trabalho.",
    },
    service: {
      title: "2. Descrição do Serviço",
      intro: "O Pomodoro Chibcha App fornece um painel de produtividade que integra:",
      items: [
        "Gestão do tempo por meio da técnica Pomodoro.",
        'Música ambiente e paisagens sonoras integradas para facilitar o estado de "Deep Work" ou fluxo de estudo.',
        "Sincronização em tempo real com o Google Tasks e o Google Calendar para centralizar suas informações essenciais.",
      ],
    },
    google: {
      title: "3. Uso Aceitável e Integração com o Google",
      body: "Ao conectar sua conta do Google, você nos concede permissão para interagir com suas Tarefas e seu Calendário de acordo com as diretrizes estabelecidas em nossa Política de Privacidade. Você é responsável pelas informações que decidir visualizar e modificar através do nosso painel. Não oferecemos nenhuma garantia sobre a disponibilidade ininterrupta das APIs do Google das quais dependemos.",
    },
    ip: {
      title: "4. Propriedade Intelectual",
      body: "O design, a estética corporativa e o código-fonte da interface do Pomodoro Chibcha App são propriedade de seus respectivos criadores. Os usuários não têm permissão para copiar, modificar ou distribuir o design proprietário da interface sem consentimento prévio, embora o código funcional possa estar sujeito a licenças Open Source (consulte nosso repositório no GitHub).",
    },
    disclaimer: {
      title: "5. Isenção de Responsabilidade",
      body: 'O serviço "Pomodoro Chibcha App" é fornecido "no estado em que se encontra" e "conforme a disponibilidade". Não garantimos que o serviço será ininterrupto, seguro ou livre de erros. Não nos responsabilizamos por perda de tarefas, compromissos perdidos decorrentes de erros de sincronização ou interrupções na música ambiente.',
    },
    discrepancyNote:
      "Em caso de divergência entre as traduções, prevalecerá a versão em espanhol.",
    backToDashboard: "Voltar ao Painel",
  },
};

export default function TermsContent() {
  const [lang, setLang] = useState<Lang>("es");
  const t = COPY[lang];

  return (
    <div
      lang={lang}
      className="min-h-screen bg-slate-950 text-slate-300 py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <FileText className="w-16 h-16 text-blue-500 mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            {t.title}
          </h1>
          <p className="text-lg text-slate-400">{t.lastUpdated}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <Globe className="w-5 h-5 text-slate-500" aria-hidden="true" />
          {LANGS.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              lang={code}
              aria-pressed={lang === code}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                lang === code
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-12 backdrop-blur-xl bg-slate-900/50 p-8 md:p-12 rounded-3xl border border-slate-800 shadow-2xl">
          <section>
            <h2 className="text-2xl font-bold text-white flex items-center mb-4">
              <CheckCircle className="w-6 h-6 mr-3 text-emerald-400" />
              {t.acceptance.title}
            </h2>
            <p className="leading-relaxed text-slate-300">{t.acceptance.body}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white flex items-center mb-4">
              <Music className="w-6 h-6 mr-3 text-indigo-400" />
              {t.service.title}
            </h2>
            <p className="leading-relaxed text-slate-300 mb-4">{t.service.intro}</p>
            <ul className="list-disc pl-6 space-y-3 text-slate-300">
              {t.service.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 mr-3 text-yellow-400" />
              {t.google.title}
            </h2>
            <p className="leading-relaxed text-slate-300">{t.google.body}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">{t.ip.title}</h2>
            <p className="leading-relaxed text-slate-300">{t.ip.body}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">{t.disclaimer.title}</h2>
            <p className="leading-relaxed text-slate-300">{t.disclaimer.body}</p>
          </section>

          <p className="text-sm text-slate-500 italic border-t border-slate-800 pt-6">
            {t.discrepancyNote}
          </p>

          <div className="pt-2 text-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              {t.backToDashboard}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
