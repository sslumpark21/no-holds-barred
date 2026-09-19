import type { Metadata } from "next"
import { ReleaseCard } from "@/components/release-card"
import { releases } from "@/lib/data"

export const metadata: Metadata = {
  title: "Releases — no.holds.barred.",
  description: "Music and other releases from no.holds.barred.",
}

export default function ReleasesPage() {
  const sorted = [...releases].sort((a, b) => +new Date(b.date) - +new Date(a.date))
  const oldestYear = sorted[sorted.length - 1]?.year
  const newestYear = sorted[0]?.year
  const yearRange = oldestYear === newestYear ? newestYear : `${oldestYear} — ${newestYear}`

  return (
    <main>
      <header className="px-4 md:px-6 pt-16 md:pt-24 pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="eyebrow text-muted-ink mb-4">Selected output</p>
          <h1 className="font-display display-huge text-6xl md:text-9xl">Releases</h1>
        </div>
        <p className="eyebrow text-muted-ink">
          {releases.length} {releases.length === 1 ? "release" : "releases"} · {yearRange}
        </p>
      </header>

      <section className="px-4 md:px-6 py-10 border-t border-line">
        <div className="grid grid-cols-1 gap-x-4 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {sorted.map((r) => (
            <ReleaseCard key={r.slug} release={r} sleeve />
          ))}
        </div>
      </section>
    </main>
  )
}
