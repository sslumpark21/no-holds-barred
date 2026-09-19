import Image from "next/image"
import Link from "next/link"
import type { Release } from "@/lib/types"

export function ReleaseCard({ release, sleeve = false }: { release: Release; sleeve?: boolean }) {
  if (sleeve) {
    return (
      <Link
        href={`/releases/${release.slug}`}
        className="group relative block min-w-0 w-[77%] transition-transform duration-[400ms] ease-out hover:z-10 hover:-translate-y-1.5 hover:scale-[1.015] focus-visible:z-10 focus-visible:-translate-y-1.5 focus-visible:scale-[1.015] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current motion-reduce:transition-none"
      >
        <div className="relative aspect-square w-full overflow-visible">
          <Image
            src="/images/vinyl-record-arc.png"
            alt=""
            fill
            sizes="(max-width: 640px) 77vw, (max-width: 1024px) 38vw, 20vw"
            className="pointer-events-none absolute inset-0 z-0 select-none object-contain translate-x-[16%] drop-shadow-[4px_9px_10px_rgba(0,0,0,.45)] transition-transform duration-[400ms] ease-out group-hover:translate-x-[31%] group-focus-visible:translate-x-[31%] motion-reduce:transition-none"
          />
          <div className="absolute left-[7.5%] top-[7.5%] z-10 h-[85%] w-[85%] overflow-hidden bg-[#121211] shadow-[0_12px_22px_rgba(0,0,0,.25)]">
            <Image
              src={release.artwork}
              alt={`${release.title} artwork`}
              width={1000}
              height={1000}
              sizes="(max-width: 640px) 65vw, (max-width: 1024px) 33vw, 17vw"
              className="h-full w-full object-cover transition-[filter] duration-[400ms] ease-out group-hover:brightness-[1.06] group-focus-visible:brightness-[1.06] motion-reduce:transition-none"
            />
          </div>
          <Image
            src="/images/record-sleeve-overlay.png"
            alt=""
            fill
            sizes="(max-width: 640px) 77vw, (max-width: 1024px) 38vw, 20vw"
            className="pointer-events-none absolute inset-0 z-20 select-none object-contain drop-shadow-[0_15px_17px_rgba(0,0,0,.42)]"
          />
        </div>
        <div className="mt-3 border-t border-line pt-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="min-w-0 truncate font-display text-lg uppercase leading-none md:text-xl">{release.title}</h3>
            <span className="eyebrow shrink-0 text-muted-ink">{release.year}</span>
          </div>
          <p className="mt-1 truncate text-xs text-muted-ink">{release.artistName}</p>
          <p className="eyebrow mt-2 text-muted-ink">{release.type}</p>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/releases/${release.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden bg-ink/5">
        <Image
          src={release.artwork || "/placeholder.svg"}
          alt={`${release.title} artwork`}
          width={1000}
          height={1000}
          sizes="(max-width: 768px) 50vw, 25vw"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
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
