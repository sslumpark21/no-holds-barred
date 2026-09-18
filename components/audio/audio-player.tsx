"use client"

import Image from "next/image"
import { Repeat, Repeat1, Shuffle } from "lucide-react"
import { useAudio } from "./audio-provider"

function fmt(s: number) {
  if (!s || !isFinite(s)) return "0:00"
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, "0")}`
}

export function AudioPlayer() {
  const { current, isPlaying, progress, currentTime, duration, volume, toggle, seek, setVolume, shuffle, repeatMode, queueLength, toggleShuffle, cycleRepeat } = useAudio()

  return (
    <div className="fixed inset-x-0 bottom-0 z-[120] border-t border-[#d5bb8a]/20 bg-[#090807]/95 text-[#ded2b8] backdrop-blur-md">
      {/* progress line spanning full width */}
      <button
        type="button"
        aria-label="Seek"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          seek((e.clientX - rect.left) / rect.width)
        }}
        className="group block h-1 w-full cursor-pointer bg-[#2b251d]"
      >
        <span className="block h-full bg-[#c7a45f]" style={{ width: `${progress * 100}%` }} />
      </button>

      <div className="flex h-16 items-center gap-3 px-3 md:h-20 md:gap-5 md:px-6">
        {/* Track info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden border border-[#d5bb8a]/20 bg-[#15120f] md:h-12 md:w-12">
            {current ? (
              <Image src={current.artwork || "/placeholder.svg"} alt="" fill className="object-cover grayscale" sizes="48px" />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="truncate font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#ded2b8]">{current ? current.title : "NO TRACK LOADED"}</p>
            <p className="eyebrow truncate text-[#a99b82]/70">
              {current ? current.artist : "no.holds.barred."}
            </p>
          </div>
        </div>

        {/* Play / pause */}
        <button
          type="button"
          onClick={toggle}
          disabled={!current}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="grid h-10 w-10 shrink-0 place-items-center border border-[#d5bb8a]/30 text-[#ded2b8] transition-colors hover:bg-[#d5bb8a]/10 disabled:opacity-30 md:h-12 md:w-12"
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

        <div className="flex items-center gap-1">
          <button type="button" onClick={toggleShuffle} disabled={!current || queueLength < 2} aria-label="Shuffle" aria-pressed={shuffle} className={`grid h-8 w-8 place-items-center border border-[#d5bb8a]/20 transition-colors disabled:cursor-not-allowed disabled:opacity-25 ${shuffle ? "text-[#d5bb8a]" : "text-[#a99b82]/60 hover:text-[#ded2b8]"}`}>
            <Shuffle size={14} strokeWidth={1.7} />
          </button>
          <button type="button" onClick={cycleRepeat} disabled={!current} aria-label={repeatMode === "one" ? "Repeat one" : "Repeat"} aria-pressed={repeatMode !== "off"} className={`grid h-8 w-8 place-items-center border border-[#d5bb8a]/20 transition-colors disabled:cursor-not-allowed disabled:opacity-25 ${repeatMode !== "off" ? "text-[#d5bb8a]" : "text-[#a99b82]/60 hover:text-[#ded2b8]"}`}>
            {repeatMode === "one" ? <Repeat1 size={14} strokeWidth={1.7} /> : <Repeat size={14} strokeWidth={1.7} />}
          </button>
        </div>

        {/* Time */}
        <div className="hidden whitespace-nowrap font-mono text-[9px] tabular-nums text-[#a99b82]/70 sm:block">
          {fmt(currentTime)} / {fmt(duration)}
        </div>

        {/* Volume */}
        <div className="hidden w-32 items-center gap-2 md:flex">
          <span className="eyebrow text-[#a99b82]/70">Vol</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
            className="h-1 w-full accent-[#c7a45f]"
          />
        </div>
      </div>
    </div>
  )
}
