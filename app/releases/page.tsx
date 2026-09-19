import type { Metadata } from "next"
import { ReleaseCard } from "@/components/release-card"
import { releases } from "@/lib/data"

export const metadata: Metadata = {
  title: "Releases — no.holds.barred.",
  description: "Music and other releases from no.holds.barred.",
}

export default function ReleasesPage() {
  const sorted = [...releases].sort((a, b) => +new Date(b.date) - +new Date(a.date))

  return (
    <main>
      <header className="px-4 md:px-6 pt-16 md:pt-24 pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="eyebrow text-muted-ink mb-4">Selected output</p>
          <h1 className="font-display display-huge text-6xl md:text-9xl">Releases</h1>
        </div>
        <p className="eyebrow text-muted-ink">
          {releases.length} releases · 2024 — 2026
        </p>
      </header>

      <section className="px-4 md:px-6 py-10 border-t border-line">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-12">
          {sorted.map((r) => (
            <ReleaseCard key={r.slug} release={r} />
          ))}
        </div>
      </section>
    </main>
  )
}
