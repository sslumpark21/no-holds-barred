"use client"

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"

export type VideoControls = { pause: () => void; resume: () => void }
type LocalVideo = { id: string; title: string; source: { kind: "file"; src: string }; thumbnail?: string }

/** Single-item playback for a selected EXCLUSIVE video. The selectable YouTube list uses an iframe in BroadcastConsole. */
export const BroadcastVideo = forwardRef<VideoControls, {
  video: LocalVideo
  active: boolean
  volume: number
}>(function BroadcastVideo({ video, active, volume }, ref) {
  const element = useRef<HTMLVideoElement | null>(null)
  const allowed = useRef(active)
  const generation = useRef(0)
  const [needsGesture, setNeedsGesture] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  const pause = useCallback(() => {
    allowed.current = false
    generation.current++
    element.current?.pause()
  }, [])
  const resume = useCallback(() => {
    const el = element.current
    if (!el || unavailable) return
    allowed.current = true
    const token = ++generation.current
    setNeedsGesture(false)
    void el.play().catch((error: DOMException) => {
      if (token === generation.current && error.name === "NotAllowedError") setNeedsGesture(true)
    })
  }, [unavailable])
  useImperativeHandle(ref, () => ({ pause, resume }), [pause, resume])

  useEffect(() => {
    const el = element.current
    if (el) el.volume = volume
  }, [volume])

  useEffect(() => {
    const el = element.current
    if (active) resume()
    else pause()
    return () => {
      allowed.current = false
      generation.current++
      el?.pause()
    }
  }, [active, pause, resume])

  return <>
    <video
      key={video.id}
      ref={element}
      src={video.source.src}
      poster={video.thumbnail}
      playsInline
      preload="metadata"
      className="absolute inset-0 h-full w-full object-cover"
      onLoadedMetadata={(event) => { event.currentTarget.volume = volume }}
      onPlay={(event) => { if (!allowed.current || event.currentTarget !== element.current) event.currentTarget.pause() }}
      onEnded={(event) => { if (event.currentTarget === element.current) pause() }}
      onError={(event) => { if (event.currentTarget === element.current && event.currentTarget.error) { setUnavailable(true); pause() } }}
    />
    <p className="absolute bottom-4 left-4 right-4 text-center font-mono text-[9px] tracking-widest text-[#ded3bc]">
      {unavailable ? "VIDEO UNAVAILABLE" : needsGesture ? "PRESS OK TO PLAY" : video.title}
    </p>
  </>
})
