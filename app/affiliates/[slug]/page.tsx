import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArtistProfile } from "@/components/artist-profile"
import { affiliates, getArtist } from "@/lib/data"

export function generateStaticParams() {
  return affiliates.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const artist = getArtist(slug)
  if (!artist) return { title: "Affiliate — no.holds.barred" }
  return { title: `${artist.name} — no.holds.barred`, description: artist.tagline }
}

export default async function AffiliatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const artist = getArtist(slug)
  if (!artist || artist.type !== "affiliate") notFound()
  return <ArtistProfile artist={artist} />
}
