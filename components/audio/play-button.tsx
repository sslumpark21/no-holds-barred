"use client"

import { useAudio, type PlayableTrack } from "./audio-provider"

interface PlayButtonProps {
  track: PlayableTrack
  className?: string
  size?: "sm" | "md" | "lg"
  label?: boolean
}

const SIZES = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
}

export function PlayButton({ track, className = "", size = "md", label = false }: PlayButtonProps) {
  const { current, isPlaying, play } = useAudio()
  const active = current?.id === track.id
  const playing = active && isPlaying

  if (label) {
    return (
      <button
        type="button"
        onClick={() => play(track)}
        className={`inline-flex items-center gap-2 eyebrow border border-ink px-4 py-2 hover-invert ${className}`}
        aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
      >
        <Icon playing={playing} />
        {playing ? "Playing" : "Play"}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => play(track)}
      className={`grid place-items-center border border-ink hover-invert ${SIZES[size]} ${
        active ? "bg-ink text-paper" : ""
      } ${className}`}
      aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
    >
      <Icon playing={playing} />
    </button>
  )
}

function Icon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <rect x="2" y="1" width="3.5" height="12" />
      <rect x="8.5" y="1" width="3.5" height="12" />
    </svg>
  ) : (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
      <path d="M2 1l11 6-11 6z" />
    </svg>
  )
}
