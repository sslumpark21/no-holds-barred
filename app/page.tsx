import Image from "next/image"
import Link from "next/link"
import { Hero } from "@/components/home/hero"
import { SectionHeading } from "@/components/section-heading"
import { ArtistCard } from "@/components/artist-card"
import { JournalCard } from "@/components/journal-card"
import { EventRow } from "@/components/event-row"
import { Tracklist } from "@/components/tracklist"
import { PlayButton } from "@/components/audio/play-button"
import { affiliates, events, featuredArtist, journal, latestRelease } from "@/lib/data"

export default function HomePage() {
  const upcoming = events.filter((e) => e.status === "upcoming").slice(0, 3)

  return (
    <main>
      <Hero />

      {/* Featured artist */}
      <section className="px-4 md:px-6 py-16 md:py-24">
        <SectionHeading eyebrow="Featured Artist" title={featuredArtist.name} href={`/artists/${featuredArtist.slug}`} hrefLabel="Full profile" />
        <div className="mt-8 grid gap-8 md:grid-cols-2 md:gap-12 items-center">
          <Link href={`/artists/${featuredArtist.slug}`} className="group relative aspect-[4/5] md:aspect-[3/4] overflow-hidden bg-ink/5">
            <Image
              src={featuredArtist.hero || "/placeholder.svg"}
              alt={featuredArtist.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-[1.03]"
            />
          </Link>
          <div>
            <p className="eyebrow text-muted-ink">{featuredArtist.role} — {featuredArtist.location}</p>
            <p className="mt-6 font-display text-3xl md:text-5xl uppercase leading-[0.95]">{featuredArtist.tagline}</p>
            {featuredArtist.bio.map((p, i) => (
              <p key={i} className="mt-5 text-sm md:text-base text-muted-ink leading-relaxed max-w-xl">
                {p}
              </p>
            ))}
            <Link href={`/artists/${featuredArtist.slug}`} className="mt-8 inline-block eyebrow border border-ink px-6 py-3 hover-invert">
              Enter profile →
            </Link>
          </div>
        </div>
      </section>

      {/* Latest release */}
      <section className="px-4 md:px-6 py-16 md:py-24 bg-ink text-paper">
        <div className="flex items-end justify-between gap-4 border-b border-paper/20 pb-4">
          <div>
            <p className="eyebrow text-paper/50 mb-3">Latest Release</p>
            <h2 className="font-display display-huge text-4xl md:text-6xl">{latestRelease.title}</h2>
          </div>
          <Link href={`/releases/${latestRelease.slug}`} className="eyebrow link-underline shrink-0 pb-2">
            View release →
          </Link>
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1.2fr] md:gap-12">
          <div>
            <div className="relative aspect-square overflow-hidden bg-paper/10 max-w-md">
              <Image src={latestRelease.artwork || "/placeholder.svg"} alt={`${latestRelease.title} artwork`} fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" />
            </div>
            <div className="mt-5 flex items-center gap-4">
              <PlayButton
                label
                className="border-paper text-paper hover:bg-paper hover:text-ink"
                track={{
                  id: latestRelease.tracklist[0].id,
                  title: latestRelease.tracklist[0].title,
                  artist: latestRelease.artistName,
                  artwork: latestRelease.artwork,
                  audioUrl: latestRelease.tracklist[0].audioUrl,
                }}
              />
              <div className="eyebrow text-paper/60">
                {latestRelease.artistName} · {latestRelease.type} · {latestRelease.catalog}
              </div>
            </div>
          </div>
          <div className="[&_*]:!border-paper/20">
            <div className="text-paper">
              <Tracklist tracks={latestRelease.tracklist} artist={latestRelease.artistName} artwork={latestRelease.artwork} />
            </div>
          </div>
        </div>
      </section>

      {/* Affiliates */}
      <section className="px-4 md:px-6 py-16 md:py-24">
        <SectionHeading eyebrow="Artists We're Listening To" title="Affiliates" href="/affiliates" />
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
          {affiliates.slice(0, 4).map((a, i) => (
            <ArtistCard key={a.slug} artist={a} index={i} />
          ))}
        </div>
      </section>

      {/* Journal */}
      <section className="px-4 md:px-6 py-16 md:py-24 border-t border-line">
        <SectionHeading eyebrow="From the Journal" title="Journal" href="/journal" />
        <div className="mt-8 grid gap-10 md:grid-cols-2">
          <JournalCard entry={journal[0]} large />
          <div className="grid gap-8">
            {journal.slice(1, 3).map((e) => (
              <JournalCard key={e.slug} entry={e} />
            ))}
          </div>
        </div>
      </section>

      {/* Events */}
      <section className="px-4 md:px-6 py-16 md:py-24 border-t border-line">
        <SectionHeading eyebrow="Next Transmissions" title="Events" href="/events" />
        <div className="mt-4">
          {upcoming.map((e) => (
            <EventRow key={e.slug} event={e} />
          ))}
        </div>
      </section>
    </main>
  )
}
