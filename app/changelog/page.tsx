import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog | Pomodoro Chibcha App",
  description: "Registro de cambios, actualizaciones y nuevas características de Pomodoro Chibcha App.",
  alternates: {
    canonical: "https://pomodoro.chibcha.club/changelog",
  },
  openGraph: {
    title: "Changelog | Pomodoro Chibcha App",
    description: "Registro de cambios, actualizaciones y nuevas características de Pomodoro Chibcha App.",
    url: "https://pomodoro.chibcha.club/changelog",
  },
};

const ANIMATED_ICONS: Record<string, string> = {
  shield: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="changelog-icon-shield"><style>@keyframes shieldPulse{0%,100%{filter:drop-shadow(0 0 2px rgba(99,102,241,0.3))}50%{filter:drop-shadow(0 0 8px rgba(99,102,241,0.8))}}@keyframes shieldLock{0%,60%,100%{transform:rotate(0)}70%{transform:rotate(-8deg)}80%{transform:rotate(8deg)}90%{transform:rotate(-4deg)}}.changelog-icon-shield{animation:shieldPulse 2s ease-in-out infinite}.changelog-icon-shield rect{animation:shieldLock 3s ease-in-out infinite}</style><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  rocket: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="changelog-icon-rocket"><style>@keyframes rocketBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}@keyframes flame{0%,100%{opacity:0.6;transform:scaleY(1)}50%{opacity:1;transform:scaleY(1.3)}}.changelog-icon-rocket{animation:rocketBounce 1.5s ease-in-out infinite}.changelog-icon-rocket .flame{animation:flame 0.8s ease-in-out infinite;transform-origin:center bottom}</style><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" class="flame"/></svg>`,
  gear: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="changelog-icon-gear"><style>@keyframes gearSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.changelog-icon-gear{animation:gearSpin 8s linear infinite;transform-origin:center}</style><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 22v-2"/><path d="m17 20.66-1-1.73"/><path d="M11 10.27 7 3.34"/><path d="m20.66 17-1.73-1"/><path d="m3.34 7 1.73 1"/><path d="M14 12h8"/><path d="M2 12h2"/><path d="m20.66 7-1.73 1"/><path d="m3.34 17 1.73-1"/><path d="m17 3.34-1 1.73"/><path d="m11 13.73-4 6.93"/></svg>`,
  bug: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="changelog-icon-bug"><style>@keyframes bugFix{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}@keyframes checkPop{0%{opacity:0;transform:scale(0)}60%{opacity:1;transform:scale(1.2)}100%{opacity:1;transform:scale(1)}}.changelog-icon-bug{animation:bugFix 2s ease-in-out infinite}.changelog-icon-bug .check{animation:checkPop 2s ease-in-out infinite;transform-origin:center}</style><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" class="check"/><path d="m9 15 2 2 4-4" class="check" stroke-width="2.5"/></svg>`,
  palette: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="changelog-icon-palette"><style>@keyframes paintDrip{0%{opacity:0;transform:translateY(-4px)}50%{opacity:1;transform:translateY(0)}100%{opacity:0.7;transform:translateY(2px)}}.changelog-icon-palette .dot{animation:paintDrip 2s ease-in-out infinite}.changelog-icon-palette .dot:nth-child(2){animation-delay:0.3s}.changelog-icon-palette .dot:nth-child(3){animation-delay:0.6s}.changelog-icon-palette .dot:nth-child(4){animation-delay:0.9s}</style><circle cx="13.5" cy="6.5" r="2" class="dot"/><circle cx="17.5" cy="10.5" r="2" class="dot"/><circle cx="8.5" cy="7.5" r="2" class="dot"/><circle cx="6.5" cy="12.5" r="2" class="dot"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.686 0-.432-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`,
  lightning: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="changelog-icon-lightning"><style>@keyframes lightningFlash{0%,100%{opacity:0.7;filter:drop-shadow(0 0 1px currentColor)}50%{opacity:1;filter:drop-shadow(0 0 6px currentColor)}}.changelog-icon-lightning{animation:lightningFlash 1.5s ease-in-out infinite}</style><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
  wrench: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="changelog-icon-wrench"><style>@keyframes wrenchSwing{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-10deg)}75%{transform:rotate(10deg)}}.changelog-icon-wrench{animation:wrenchSwing 2s ease-in-out infinite;transform-origin:center}</style><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  book: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="changelog-icon-book"><style>@keyframes pageTurn{0%,100%{transform:rotateY(0)}50%{transform:rotateY(-5deg)}}.changelog-icon-book{animation:pageTurn 3s ease-in-out infinite;transform-origin:left center}</style><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
  flask: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="changelog-icon-flask"><style>@keyframes bubble{0%{transform:translateY(0) scale(1);opacity:0.8}100%{transform:translateY(-8px) scale(0.5);opacity:0}}.changelog-icon-flask .bubble{animation:bubble 1.5s ease-in-out infinite}.changelog-icon-flask .bubble:nth-child(2){animation-delay:0.5s}.changelog-icon-flask .bubble:nth-child(3){animation-delay:1s}</style><path d="M8.5 2h7"/><path d="M12 2v7.5"/><path d="M19 18H5l3-10h8z"/><circle cx="10" cy="14" r="0.5" class="bubble"/><circle cx="13" cy="12" r="0.5" class="bubble"/><circle cx="11" cy="16" r="0.5" class="bubble"/></svg>`,
  undo: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="changelog-icon-undo"><style>@keyframes undoSlide{0%,100%{transform:translateX(0)}50%{transform:translateX(-3px)}}.changelog-icon-undo{animation:undoSlide 2s ease-in-out infinite}</style><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
};

function getIconForHeading(text: string): string {
  const lower = text.toLowerCase();
  if (/seguridad|security|shield/.test(lower)) return ANIMATED_ICONS.shield ?? "";
  if (/nueva|feature|rocket|caracter/.test(lower)) return ANIMATED_ICONS.rocket ?? "";
  if (/correcci|fix|bug/.test(lower)) return ANIMATED_ICONS.bug ?? "";
  if (/mejora|refactor|gear|interna/.test(lower)) return ANIMATED_ICONS.gear ?? "";
  if (/estilo|visual|palette|dise/.test(lower)) return ANIMATED_ICONS.palette ?? "";
  if (/rendimiento|perf|lightning|veloc/.test(lower)) return ANIMATED_ICONS.lightning ?? "";
  if (/manten|wrench|chore/.test(lower)) return ANIMATED_ICONS.wrench ?? "";
  if (/document|book|docs/.test(lower)) return ANIMATED_ICONS.book ?? "";
  if (/prueba|test|flask/.test(lower)) return ANIMATED_ICONS.flask ?? "";
  if (/revert|undo/.test(lower)) return ANIMATED_ICONS.undo ?? "";
  return "";
}

async function getChangelogContent() {
  try {
    const filePath = path.join(process.cwd(), "CHANGELOG.md");
    const content = fs.readFileSync(filePath, "utf8");
    return content;
  } catch (error) {
    console.error("Error reading CHANGELOG.md", error);
    return "# Error loading changelog\n\nCould not load the changelog file.";
  }
}

export default async function ChangelogPage() {
  const content = await getChangelogContent();

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-rose-500/30">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-neutral-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-5" />
            <span>Back to App</span>
          </Link>
          <span className="text-sm font-medium text-zinc-500">v0.10.0</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-24">
        <article className="prose prose-invert prose-headings:text-white prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-strong:text-white prose-code:text-rose-200 prose-pre:bg-neutral-900 prose-li:text-zinc-300">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ ...props }) => (
                <div className="mt-12 mb-6 pb-2 border-b border-neutral-800">
                  <h2
                    className="text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 inline-block"
                    {...props}
                  />
                </div>
              ),
              h3: ({ children, ...props }) => {
                const text = String(children || "");
                const cleanText = text.replace(/<!--icon:\w+-->\s?/g, "");
                const iconHtml = getIconForHeading(text);

                return (
                  <h3
                    className="text-xl font-semibold text-white mt-8 mb-4 flex items-center gap-3"
                    {...props}
                  >
                    {iconHtml && (
                      <span
                        className="inline-flex shrink-0"
                        dangerouslySetInnerHTML={{ __html: iconHtml }}
                      />
                    )}
                    {cleanText}
                  </h3>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </article>

        <section className="mt-16 pt-8 border-t border-neutral-800 text-center">
          <p className="text-zinc-500 mb-4">
            Thank you for using Pomodoro & Dashboard.
          </p>
        </section>
      </main>
    </div>
  );
}
