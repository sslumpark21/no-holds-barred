"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import { youtubeVideoId } from "@/lib/youtube"

type Player = {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  setVolume: (volume: number) => void
  destroy: () => void
}
type YTApi = { Player: new (element: HTMLElement, options: Record<string, unknown>) => Player; PlayerState: { PLAYING: number } }
declare global { interface Window { YT?: YTApi; onYouTubeIframeAPIReady?: () => void; __ytApiPromise?: Promise<void> } }

export type YouTubeControls = { toggle: () => void; play: () => void; pause: () => void; seekBy: (seconds: number) => void; setVolume: (volume: number) => void }

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve()
  if (window.__ytApiPromise) return window.__ytApiPromise
  window.__ytApiPromise = new Promise<void>((resolve) => {
    const priorReady = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => { priorReady?.(); resolve() }
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script")
      script.src = "https://www.youtube.com/iframe_api"
      document.head.appendChild(script)
    }
  })
  return window.__ytApiPromise
}

export const YouTubePlayer = forwardRef<YouTubeControls, {
  url: string
  title: string
  volume: number
}>(function YouTubePlayer({ url, title, volume }, ref) {
  const mount = useRef<HTMLDivElement | null>(null)
  const player = useRef<Player | null>(null)
  const duration = useRef(0)
  const videoId = youtubeVideoId(url)

  useImperativeHandle(ref, () => ({
    play: () => player.current?.playVideo(),
    pause: () => player.current?.pauseVideo(),
    toggle: () => {
      const active = player.current
      if (!active) return
      if (active.getPlayerState() === window.YT?.PlayerState.PLAYING) active.pauseVideo()
      else active.playVideo()
    },
    seekBy: (seconds) => {
      const active = player.current
      if (!active) return
      const currentTime = active.getCurrentTime() || 0
      const total = active.getDuration() || duration.current
      const next = Math.max(0, Math.min(total || currentTime + seconds, currentTime + seconds))
      active.seekTo(next, true)
    },
    setVolume: (value) => player.current?.setVolume(Math.round(Math.max(0, Math.min(1, value)) * 100)),
  }), [])

  useEffect(() => {
    let disposed = false
    if (!videoId || !mount.current) return
    void loadYouTubeApi().then(() => {
      if (disposed || !mount.current || !window.YT) return
      player.current = new window.YT.Player(mount.current, {
        videoId,
        playerVars: { autoplay: 1, controls: 1, enablejsapi: 1, playsinline: 1, rel: 0, origin: window.location.origin },
        events: {
          onReady: (event: { target: Player }) => { player.current = event.target; event.target.setVolume(Math.round(volume * 100)); duration.current = event.target.getDuration() || 0 },
        },
      })
    })
    return () => { disposed = true; player.current?.destroy(); player.current = null }
  }, [videoId])

  useEffect(() => { player.current?.setVolume(Math.round(Math.max(0, Math.min(1, volume)) * 100)) }, [volume])

  if (!videoId) return <div className="absolute inset-0 grid place-items-center bg-black font-mono text-xs text-[#ded3bc]">VIDEO UNAVAILABLE</div>
  return <div className="pointer-events-auto absolute inset-0 bg-black" aria-label={title}>
    <div ref={mount} className="pointer-events-auto h-full w-full [&_iframe]:pointer-events-auto [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0" />
  </div>
})
