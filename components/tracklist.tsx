"use client"

import { PlayButton } from "./audio/play-button"
import { useAudio } from "./audio/audio-provider"
import type { Track } from "@/lib/types"

interface TracklistProps {
  tracks: Track[]
  artist: string
  artwork: string
}

export function Tracklist({ tracks, artist, artwork }: TracklistProps) {
  const { current, isPlaying } = useAudio()

  return (
    <ol className="border-t border-line">
      {tracks.map((t, i) => {
        const active = current?.id === t.id
        return (
          <li
            key={t.id}
            className={`group flex items-center gap-4 border-b border-line py-3 px-2 -mx-2 transition-colors ${
              active ? "bg-ink/[0.04]" : "hover:bg-ink/[0.03]"
            }`}
          >
            <span className="eyebrow text-muted-ink w-6 tabular-nums shrink-0">
              {(i + 1).toString().padStart(2, "0")}
            </span>
            <PlayButton
              size="sm"
              track={{ id: t.id, title: t.title, artist, artwork, audioUrl: t.audioUrl }}
            />
            <span className={`flex-1 text-sm truncate ${active ? "font-medium" : ""}`}>
              {t.title}
              {active && isPlaying ? <span className="ml-2 eyebrow text-muted-ink">Now playing</span> : null}
            </span>
            <span className="eyebrow text-muted-ink tabular-nums shrink-0">{t.duration}</span>
          </li>
        )
      })}
    </ol>
  )
}
