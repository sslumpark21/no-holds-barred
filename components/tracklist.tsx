import type { Track } from "@/lib/types"

interface TracklistProps {
  tracks: Track[]
}

export function Tracklist({ tracks }: TracklistProps) {
  return (
    <ol className="border-t border-line">
      {tracks.map((t, i) => (
        <li
          key={t.id}
          className="flex items-center gap-4 border-b border-line py-3 px-2 -mx-2 transition-colors hover:bg-ink/[0.03]"
        >
          <span className="eyebrow text-muted-ink w-6 tabular-nums shrink-0">
            {(i + 1).toString().padStart(2, "0")}
          </span>
          <span className="flex-1 text-sm truncate">
            {t.title}
          </span>
          <span className="eyebrow text-muted-ink tabular-nums shrink-0">{t.duration}</span>
        </li>
      ))}
    </ol>
  )
}
