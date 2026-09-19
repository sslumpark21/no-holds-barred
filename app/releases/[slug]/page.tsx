import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getArtist, getRelease, releases } from "@/lib/data"
import { Tracklist } from "@/components/tracklist"

export function generateStaticParams() {
  return releases.map((r) => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const release = getRelease(slug)
  if (!release) return { title: "Release — no.holds.barred." }
  return { title: `${release.title} — ${release.artistName}`, description: release.description[0] }
}

export default async function ReleasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const release = getRelease(slug)
  if (!release) notFound()

  const artist = getArtist(release.artistSlug)
  const tvView = release.type === "Single" ? "singles" : "albums-eps"
  const tvQuery = new URLSearchParams({ tv: "1", artist: release.artistSlug, view: tvView, release: release.slug })
  const tvHref = `/?${tvQuery.toString()}#broadcast`

  return (
    <main>
      <section className="grid md:grid-cols-2">
        <div className="relative aspect-square w-full max-w-[1000px] self-start overflow-hidden bg-ink/5">
          <Image src={release.artwork} alt={`${release.title} artwork`} width={1000} height={1000} priority sizes="(max-width:768px) 100vw, 50vw" className="h-full w-full object-cover" />
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
        </div>
      </section>

      <section className="px-4 md:px-6 py-12 md:py-16 border-t border-line">
        <h2 className="eyebrow text-muted-ink mb-8">Tracklist</h2>
        <div className="max-w-3xl">
          {release.tracklist.length ? <Tracklist tracks={release.tracklist} /> : <p className="text-sm text-muted-ink">No tracks announced.</p>}
        </div>
      </section>

      <section className="border-t border-line px-4 py-12 md:px-6 md:py-16">
        <Link href={tvHref} className="inline-flex border border-line bg-ink px-6 py-4 font-mono text-xs font-bold uppercase tracking-[0.18em] text-paper transition-colors hover:bg-[#29251e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
          Listen on TV
        </Link>
      </section>
    </main>
  )
}
