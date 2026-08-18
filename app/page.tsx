import { OnePage } from "@/components/OnePage";

// This app is embedded inside the WordPress site, which already provides the
// site header and footer. So the visualizer renders ONLY its own body — no
// header, no footer — to avoid duplicating the site chrome.
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      {/* Brand hero band (navy, matches the site's section styling) */}
      <section className="bg-[var(--color-navy)] text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
            AI Railing Visualizer
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            See your railing before it&apos;s built
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Upload a photo of your deck, porch, balcony, or staircase, choose your system and
            finishes, and preview our premium glass and aluminium railing systems — all on
            one page.
          </p>
        </div>
      </section>

      <main className="mx-auto -mt-8 w-full max-w-5xl flex-1 px-4 pb-12 sm:px-6">
        <OnePage />
      </main>
    </div>
  );
}
