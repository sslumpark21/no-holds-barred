import Image from "next/image"
import Link from "next/link"
import type { Release } from "@/lib/types"

export function ReleaseCard({ release }: { release: Release }) {
  return (
    <Link href={`/releases/${release.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden bg-ink/5">
        <Image
          src={release.artwork || "/placeholder.svg"}
          alt={`${release.title} artwork`}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <span className="absolute top-2 left-2 eyebrow bg-paper/90 px-2 py-1">{release.type}</span>
      </div>
      <div className="pt-3 border-t border-line mt-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-lg md:text-xl uppercase leading-none truncate">{release.title}</h3>
          <span className="eyebrow text-muted-ink shrink-0">{release.year}</span>
        </div>
        <p className="mt-1 text-xs text-muted-ink truncate">{release.artistName}</p>
      </div>
    </Link>
  )
}
