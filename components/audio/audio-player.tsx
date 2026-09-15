"use client"

import Image from "next/image"
import { useAudio } from "./audio-provider"

function fmt(s: number) {
  if (!s || !isFinite(s)) return "0:00"
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, "0")}`
}

export function AudioPlayer() {
  const { current, isPlaying, progress, currentTime, duration, volume, toggle, seek, setVolume } = useAudio()

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-line bg-paper/95 backdrop-blur-md">
      {/* progress line spanning full width */}
      <button
        type="button"
        aria-label="Seek"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          seek((e.clientX - rect.left) / rect.width)
        }}
        className="group block w-full h-1 bg-line cursor-pointer"
      >
        <span className="block h-full bg-ink" style={{ width: `${progress * 100}%` }} />
      </button>

      <div className="flex items-center gap-3 md:gap-5 px-3 md:px-6 h-16 md:h-20">
        {/* Track info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative h-10 w-10 md:h-12 md:w-12 shrink-0 bg-ink/10 overflow-hidden">
            {current ? (
              <Image src={current.artwork || "/placeholder.svg"} alt="" fill className="object-cover grayscale" sizes="48px" />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{current ? current.title : "No track selected"}</p>
            <p className="eyebrow text-muted-ink truncate">
              {current ? current.artist : "no.holds.barred"}
            </p>
          </div>
        </div>

        {/* Play / pause */}
        <button
          type="button"
          onClick={toggle}
          disabled={!current}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="grid place-items-center h-10 w-10 md:h-12 md:w-12 border border-ink hover-invert disabled:opacity-30 shrink-0"
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
              <rect x="2" y="1" width="3.5" height="12" />
              <rect x="8.5" y="1" width="3.5" height="12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
              <path d="M2 1l11 6-11 6z" />
            </svg>
          )}
        </button>

        {/* Time */}
        <div className="hidden sm:block eyebrow text-muted-ink tabular-nums whitespace-nowrap">
          {fmt(currentTime)} / {fmt(duration)}
        </div>

        {/* Volume */}
        <div className="hidden md:flex items-center gap-2 w-28">
          <span className="eyebrow text-muted-ink">Vol</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
            className="w-full accent-black h-1"
          />
        </div>
      </div>
    </div>
  )
}
