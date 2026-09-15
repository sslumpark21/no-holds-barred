import type { Metadata } from "next"
import { ArtistCard } from "@/components/artist-card"
import { SectionHeading } from "@/components/section-heading"
import { artists, affiliates } from "@/lib/data"

export const metadata: Metadata = {
  title: "Artists — no.holds.barred",
  description: "Members and affiliates of the no.holds.barred collective.",
}

export default function ArtistsPage() {
  return (
    <main>
      <header className="px-4 md:px-6 pt-16 md:pt-24 pb-8">
        <p className="eyebrow text-muted-ink mb-4">Roster</p>
        <h1 className="font-display display-huge text-6xl md:text-9xl">Artists</h1>
        <p className="mt-6 max-w-xl text-sm md:text-base text-muted-ink leading-relaxed">
          The people who make no.holds.barred. Official members release through the label; affiliates
          are artists we curate and champion.
        </p>
      </header>

      <section className="px-4 md:px-6 py-10">
        <SectionHeading eyebrow="Signed to the label" title="Members" />
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
          {artists.map((a, i) => (
            <ArtistCard key={a.slug} artist={a} index={i} />
          ))}
        </div>
      </section>

      <section className="px-4 md:px-6 py-10 border-t border-line">
        <SectionHeading eyebrow="Artists we're listening to" title="Affiliates" href="/affiliates" hrefLabel="The archive" />
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
          {affiliates.map((a, i) => (
            <ArtistCard key={a.slug} artist={a} index={i} />
          ))}
        </div>
      </section>
    </main>
  )
}
