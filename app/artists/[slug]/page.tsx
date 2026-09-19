import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArtistProfile } from "@/components/artist-profile"
import { artists, getArtist } from "@/lib/data"

export function generateStaticParams() {
  return artists.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const artist = getArtist(slug)
  if (!artist) return { title: "Artist — no.holds.barred." }
  return { title: `${artist.name} — no.holds.barred.`, description: artist.tagline }
}

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const artist = getArtist(slug)
  if (!artist || artist.type !== "member") notFound()
  return <ArtistProfile artist={artist} />
}
