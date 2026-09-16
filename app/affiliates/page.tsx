import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { affiliates } from "@/lib/data"

export const metadata: Metadata = {
  title: "Affiliates — no.holds.barred",
  description: "Artists we're listening to. A curated recommendation archive from no.holds.barred.",
}

export default function AffiliatesPage() {
  return (
    <main>
      <header className="px-4 md:px-6 pt-16 md:pt-24 pb-12 border-b border-line">
        <p className="eyebrow text-muted-ink mb-4">A Recommendation Archive</p>
        <h1 className="font-display display-huge text-6xl md:text-9xl">Affiliates</h1>
        <p className="mt-8 max-w-2xl text-xl md:text-3xl leading-snug">
          Artists we&apos;re listening to. Not signed, not managed — simply the music that keeps
          finding its way into our rooms.
        </p>
        <p className="mt-4 max-w-xl text-sm text-muted-ink leading-relaxed">
          Affiliation is our way of pointing outward. Every name here has been personally curated by
          the collective. Follow them. Support them.
        </p>
      </header>

      <section className="border-t border-line">
        {affiliates.map((a, i) => (
          <Link
            key={a.slug}
            href={`/affiliates/${a.slug}`}
            className="group grid grid-cols-[1fr] md:grid-cols-[6rem_14rem_1fr_auto] items-center gap-4 md:gap-8 border-b border-line px-4 md:px-6 py-6 hover:bg-ink/[0.03] transition-colors"
          >
            <span className="hidden md:block eyebrow text-muted-ink tabular-nums">
              {(i + 1).toString().padStart(2, "0")}
            </span>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-ink/5">
                <Image src={a.portrait || "/placeholder.svg"} alt={a.name} fill sizes="64px" className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl uppercase leading-none group-hover:italic">{a.name}</h2>
            </div>
            <p className="text-sm text-muted-ink max-w-md">{a.tagline}</p>
            <div className="flex items-center gap-6 md:justify-end">
              <span className="eyebrow text-muted-ink">{a.location}</span>
              <span className="eyebrow hidden md:inline">→</span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}
