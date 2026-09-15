import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getArtist, getRelease, releases } from "@/lib/data"
import { Tracklist } from "@/components/tracklist"
import { PlayButton } from "@/components/audio/play-button"
import { ReleaseCard } from "@/components/release-card"

export function generateStaticParams() {
  return releases.map((r) => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const release = getRelease(slug)
  if (!release) return { title: "Release — no.holds.barred" }
  return { title: `${release.title} — ${release.artistName}`, description: release.description[0] }
}

export default async function ReleasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const release = getRelease(slug)
  if (!release) notFound()

  const artist = getArtist(release.artistSlug)
  const more = releases.filter((r) => r.slug !== release.slug).slice(0, 4)

  return (
    <main>
      <section className="grid md:grid-cols-2">
        <div className="relative aspect-square md:aspect-auto md:min-h-[80vh] bg-ink/5">
          <Image src={release.artwork || "/placeholder.svg"} alt={`${release.title} artwork`} fill priority sizes="(max-width:768px) 100vw, 50vw" className="object-cover" />
        </div>
        <div className="px-4 md:px-8 py-10 md:py-16 flex flex-col justify-center">
          <Link href="/releases" className="eyebrow text-muted-ink link-underline w-fit mb-8">
            ← All releases
          </Link>
          <p className="eyebrow text-muted-ink mb-4">
            {release.type} · {release.catalog} · {release.year}
          </p>
          <h1 className="font-display display-huge text-5xl md:text-7xl">{release.title}</h1>
          {artist ? (
            <Link href={`/artists/${artist.slug}`} className="mt-4 font-display text-xl md:text-2xl uppercase link-underline w-fit">
              {release.artistName}
            </Link>
          ) : (
            <p className="mt-4 font-display text-xl md:text-2xl uppercase">{release.artistName}</p>
          )}
          {release.description.map((p, i) => (
            <p key={i} className="mt-5 text-sm md:text-base text-muted-ink leading-relaxed max-w-lg">
              {p}
            </p>
          ))}
          <div className="mt-8">
            <PlayButton
              label
              track={{
                id: release.tracklist[0].id,
                title: release.tracklist[0].title,
                artist: release.artistName,
                artwork: release.artwork,
                audioUrl: release.tracklist[0].audioUrl,
              }}
            />
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 py-12 md:py-16 border-t border-line">
        <h2 className="eyebrow text-muted-ink mb-8">Tracklist</h2>
        <div className="max-w-3xl">
          <Tracklist tracks={release.tracklist} artist={release.artistName} artwork={release.artwork} />
        </div>
      </section>

      <section className="px-4 md:px-6 py-12 md:py-16 border-t border-line">
        <h2 className="eyebrow text-muted-ink mb-8">More from the catalogue</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
          {more.map((r) => (
            <ReleaseCard key={r.slug} release={r} />
          ))}
        </div>
      </section>
    </main>
  )
}
