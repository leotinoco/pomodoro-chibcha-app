import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to App</span>
          </Link>
          <span className="text-sm font-medium text-gray-500">v0.1.0 Beta</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-24">
        <article className="prose prose-invert prose-headings:text-white prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-strong:text-white prose-code:text-rose-200 prose-pre:bg-neutral-900 prose-li:text-gray-300">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ node, ...props }) => (
                <div className="mt-12 mb-6 pb-2 border-b border-neutral-800">
                  <h2
                    className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 inline-block"
                    {...props}
                  />
                </div>
              ),
              h3: ({ node, ...props }) => (
                <h3
                  className="text-xl font-semibold text-white mt-8 mb-4 flex items-center gap-2"
                  {...props}
                />
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </article>

        <section className="mt-16 pt-8 border-t border-neutral-800 text-center">
          <p className="text-gray-500 mb-4">
            Thank you for using Pomodoro & Dashboard.
          </p>
        </section>
      </main>
    </div>
  );
}
