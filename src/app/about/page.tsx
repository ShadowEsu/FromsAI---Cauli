import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — Cauli",
  description:
    "About Cauli: voice-first Google Forms AI built with Jac and Next.js. Links to demo, docs, and repo.",
};

const EXTERNAL = [
  {
    href: "https://cauliform-ai-293051374734.us-west1.run.app",
    title: "Live demo",
    subtitle: "Hosted app on Google Cloud Run",
  },
  {
    href: "https://docs.jaseci.org",
    title: "Jac language",
    subtitle: "Official Jac & Jaseci documentation",
  },
  {
    href: "https://youtu.be/N7ZOtOqVaf8",
    title: "Demo video",
    subtitle: "Walkthrough on YouTube",
  },
  {
    href: "https://github.com/ShadowEsu/Cauliform_JacsAndJaseci",
    title: "GitHub repo",
    subtitle: "Source code for this project",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50/30 text-gray-900">
      <div className="mx-auto max-w-2xl px-5 py-10 pb-16 md:py-14 md:pb-20">
        <p className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-base font-semibold text-amber-900 hover:text-amber-700 underline-offset-4 hover:underline"
          >
            ← Back to Cauli
          </Link>
        </p>

        <header className="mb-10 md:mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
            About Cauli
          </h1>
          <p className="mt-4 text-xl leading-relaxed text-gray-600 md:text-2xl md:leading-snug">
            Voice-first assistant for Google Forms — paste a link, talk through questions with{" "}
            <strong className="font-semibold text-gray-800">Gemini Live</strong>, confirm answers,
            and submit via automation.
          </p>
        </header>

        <section
          aria-labelledby="about-summary-heading"
          className="mb-12 rounded-2xl border-2 border-amber-200 bg-amber-50/90 p-6 shadow-sm md:mb-14 md:p-8"
        >
          <h2
            id="about-summary-heading"
            className="text-2xl font-bold text-amber-950 md:text-3xl"
          >
            Built with Jac + Next.js
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-amber-950/90 md:text-xl">
            Form URL parsing and validation live in the{" "}
            <strong className="font-semibold">Jac</strong> module{" "}
            <code className="rounded-md bg-white/80 px-2 py-0.5 text-base font-mono text-amber-900 ring-1 ring-amber-200/80">
              jac/form_parser.jac
            </code>
            . The voice UI and API routes are{" "}
            <strong className="font-semibold">Next.js</strong> and React.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-amber-950/85 md:text-xl">
            Made for the NEXT GEN PRODUCT LAB hackathon and the Gemini Live Agent Challenge.
          </p>
        </section>

        <section aria-labelledby="links-heading" className="mb-10">
          <h2
            id="links-heading"
            className="mb-6 text-2xl font-bold text-gray-900 md:text-3xl"
          >
            Links
          </h2>
          <ul className="flex flex-col gap-4">
            {EXTERNAL.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm transition hover:border-amber-400 hover:shadow-md md:p-6"
                >
                  <span className="text-xl font-bold text-gray-900 group-hover:text-amber-900 md:text-2xl">
                    {item.title}
                    <span className="ml-2 inline-block text-amber-600 transition group-hover:translate-x-0.5">
                      ↗
                    </span>
                  </span>
                  <span className="mt-2 text-base text-gray-600 md:text-lg">{item.subtitle}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="jac-heading">
          <h2 id="jac-heading" className="mb-4 text-2xl font-bold md:text-3xl">
            Jac in this repo
          </h2>
          <ul className="space-y-4 text-lg leading-relaxed text-gray-700 md:text-xl">
            <li>
              <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-base md:text-lg">
                jac/form_parser.jac
              </code>
              — URL helpers and <code className="font-mono">parse_google_form</code>
            </li>
            <li>
              <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-base md:text-lg">
                jac/smoke.jac
              </code>
              — quick Jac runtime checks
            </li>
            <li>
              See the repository <strong className="font-semibold text-gray-900">README</strong> for
              install steps, env vars, and optional Jac-backed <code className="font-mono">/api/parse-form</code>.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
