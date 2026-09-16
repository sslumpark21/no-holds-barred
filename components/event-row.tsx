import Image from "next/image"
import type { NHBEvent } from "@/lib/types"

export function EventRow({ event }: { event: NHBEvent }) {
  return (
    <article className="group grid grid-cols-1 md:grid-cols-[8rem_1fr_auto] gap-4 md:gap-8 items-center border-b border-line py-6 md:py-8">
      <div className="eyebrow text-muted-ink">{event.dateLabel}</div>

      <div className="flex items-center gap-5">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden bg-ink/5 hidden sm:block">
          <Image
            src={event.image || "/placeholder.svg"}
            alt=""
            fill
            sizes="112px"
            className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0"
          />
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-2xl md:text-3xl uppercase leading-none">{event.title}</h3>
          <p className="mt-2 text-sm text-muted-ink">
            {event.venue}, {event.city}
          </p>
          <p className="mt-1 text-xs text-muted-ink truncate">{event.lineup.join(" · ")}</p>
        </div>
      </div>

      <div className="md:text-right">
        {event.status === "upcoming" ? (
          <span className="inline-block eyebrow border border-ink px-4 py-2 hover-invert cursor-pointer">
            RSVP
          </span>
        ) : (
          <span className="eyebrow text-muted-ink">Archived</span>
        )}
      </div>
    </article>
  )
}
