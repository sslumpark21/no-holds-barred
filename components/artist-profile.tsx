import Image from "next/image"
import Link from "next/link"
import type { Artist } from "@/lib/types"
import { getEventsBySlugs, getReleasesByArtist } from "@/lib/data"
import { ReleaseCard } from "./release-card"
import { EventRow } from "./event-row"
import { Tracklist } from "./tracklist"

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="px-4 md:px-6 py-12 md:py-16 border-t border-line">
      <h2 className="eyebrow text-muted-ink mb-8">{label}</h2>
      {children}
    </section>
  )
}

export function ArtistProfile({ artist }: { artist: Artist }) {
  const releases = getReleasesByArtist(artist.slug)
  const artistEvents = getEventsBySlugs(artist.eventSlugs)
  const backHref = artist.type === "affiliate" ? "/affiliates" : "/artists"
  const backLabel = artist.type === "affiliate" ? "All affiliates" : "All artists"

  return (
    <main>
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[440px] w-full overflow-hidden bg-ink text-paper">
        <Image src={artist.hero || "/placeholder.svg"} alt={artist.name} fill priority sizes="100vw" className="object-cover opacity-75" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-ink/30" />
        <div className="relative z-10 flex h-full flex-col justify-between px-4 md:px-6 py-8">
          <Link href={backHref} className="eyebrow text-paper/70 link-underline w-fit">
            ← {backLabel}
          </Link>
          <div>
            <p className="eyebrow text-paper/70 mb-4">
              {artist.type === "affiliate" ? "Affiliate" : "Member"} — {artist.location}
            </p>
            <h1 className="font-display display-huge text-6xl md:text-[10vw]">{artist.name}</h1>
            <p className="mt-4 font-display text-lg md:text-2xl uppercase text-paper/80 max-w-2xl">{artist.tagline}</p>
          </div>
        </div>
      </section>

      {/* Bio + meta */}
      <section className="px-4 md:px-6 py-12 md:py-16 grid gap-8 md:grid-cols-[1fr_2fr]">
        <div className="space-y-6">
          <div>
            <p className="eyebrow text-muted-ink mb-2">Role</p>
            <p className="text-sm">{artist.role}</p>
          </div>
          <div>
            <p className="eyebrow text-muted-ink mb-2">Location</p>
            <p className="text-sm">{artist.location}</p>
          </div>
          <div>
            <p className="eyebrow text-muted-ink mb-2">Links</p>
            <ul className="space-y-1">
              {artist.socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} className="text-sm link-underline">
                    {s.label} →
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <p className="eyebrow text-muted-ink mb-4">Biography</p>
          {artist.bio.map((p, i) => (
            <p key={i} className="text-lg md:text-2xl leading-snug mb-5 max-w-3xl">
              {p}
            </p>
          ))}
        </div>
      </section>

      {releases.length > 0 && (
        <Block label="Music">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
            {releases.map((r) => (
              <ReleaseCard key={r.slug} release={r} />
            ))}
          </div>
        </Block>
      )}

      {artist.unreleased.length > 0 && (
        <Block label="Unreleased">
          <div className="max-w-3xl">
            <Tracklist tracks={artist.unreleased} artist={artist.name} artwork={artist.portrait} />
            <p className="mt-4 eyebrow text-muted-ink">Works in progress · not yet officially released</p>
          </div>
        </Block>
      )}

      {artist.videos.length > 0 && (
        <Block label="Videos">
          <div className="grid gap-6 md:grid-cols-2">
            {artist.videos.map((v) => (
              <div key={v.id} className="group">
                <div className="relative aspect-video overflow-hidden bg-ink/5">
                  <Image src={v.thumbnail || "/placeholder.svg"} alt={v.title} fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid place-items-center h-14 w-14 border border-paper text-paper">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true"><path d="M2 1l11 6-11 6z" /></svg>
                    </span>
                  </span>
                </div>
                <div className="mt-3 flex justify-between border-t border-line pt-3">
                  <span className="font-display text-lg uppercase">{v.title}</span>
                  <span className="eyebrow text-muted-ink">{v.year}</span>
                </div>
              </div>
            ))}
          </div>
        </Block>
      )}

      {artist.merch.length > 0 && (
        <Block label="Merch">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
            {artist.merch.map((m) => (
              <div key={m.id} className="group">
                <div className="relative aspect-square overflow-hidden bg-ink/5">
                  <Image src={m.image || "/placeholder.svg"} alt={m.name} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="mt-3 flex justify-between border-t border-line pt-3">
                  <span className="text-sm">{m.name}</span>
                  <span className="eyebrow">{m.price}</span>
                </div>
              </div>
            ))}
          </div>
        </Block>
      )}

      {artist.news.length > 0 && (
        <Block label="News">
          <ul className="max-w-3xl">
            {artist.news.map((n) => (
              <li key={n.id} className="flex gap-6 border-b border-line py-4">
                <span className="eyebrow text-muted-ink shrink-0 w-24">{n.date}</span>
                <span className="text-sm md:text-base">{n.title}</span>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {artistEvents.length > 0 && (
        <Block label="Events">
          <div>
            {artistEvents.map((e) => (
              <EventRow key={e.slug} event={e} />
            ))}
          </div>
        </Block>
      )}

      {artist.photos.length > 0 && (
        <Block label="Photos">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {artist.photos.map((p, i) => (
              <div key={i} className="relative aspect-[4/5] overflow-hidden bg-ink/5">
                <Image src={p || "/placeholder.svg"} alt={`${artist.name} photo ${i + 1}`} fill sizes="(max-width:768px) 50vw, 33vw" className="object-cover grayscale hover:grayscale-0 transition-all duration-700" />
              </div>
            ))}
          </div>
        </Block>
      )}

      {artist.press.length > 0 && (
        <Block label="Press">
          <div className="grid gap-8 md:grid-cols-2 max-w-5xl">
            {artist.press.map((p) => (
              <blockquote key={p.id} className="border-l border-ink pl-6">
                <p className="font-display text-2xl md:text-3xl uppercase leading-tight">&ldquo;{p.quote}&rdquo;</p>
                <footer className="mt-3 eyebrow text-muted-ink">
                  {p.outlet} · {p.year}
                </footer>
              </blockquote>
            ))}
          </div>
        </Block>
      )}
    </main>
  )
}
