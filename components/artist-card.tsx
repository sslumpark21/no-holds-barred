import Image from "next/image"
import Link from "next/link"
import type { Artist } from "@/lib/types"

interface ArtistCardProps {
  artist: Artist
  index?: number
}

export function ArtistCard({ artist, index }: ArtistCardProps) {
  const base = artist.type === "affiliate" ? "/affiliates" : "/artists"
  return (
    <Link href={`${base}/${artist.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-ink/5">
        <Image
          src={artist.portrait || "/placeholder.svg"}
          alt={`Portrait of ${artist.name}`}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-[1.03]"
        />
        {typeof index === "number" ? (
          <span className="absolute top-3 left-3 eyebrow text-paper mix-blend-difference">
            {(index + 1).toString().padStart(2, "0")}
          </span>
        ) : null}
      </div>
      <div className="pt-3 flex items-baseline justify-between gap-2 border-t border-line mt-3">
        <h3 className="font-display text-xl md:text-2xl uppercase leading-none">{artist.name}</h3>
        <span className="eyebrow text-muted-ink shrink-0">{artist.role}</span>
      </div>
      <p className="mt-1 text-xs text-muted-ink">{artist.location}</p>
    </Link>
  )
}
