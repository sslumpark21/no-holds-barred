"use client"

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"

export interface PlayableTrack {
  id: string
  title: string
  artist: string
  artwork: string
  audioUrl: string
}

interface AudioContextValue {
  current: PlayableTrack | null
  isPlaying: boolean
  progress: number // 0..1
  currentTime: number
  duration: number
  volume: number
  play: (track: PlayableTrack) => void
  toggle: () => void
  seek: (fraction: number) => void
  setVolume: (v: number) => void
}

const AudioCtx = createContext<AudioContextValue | null>(null)

export function useAudio() {
  const ctx = useContext(AudioCtx)
  if (!ctx) throw new Error("useAudio must be used within AudioProvider")
  return ctx
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [current, setCurrent] = useState<PlayableTrack | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.8)

  useEffect(() => {
    const el = new Audio()
    el.preload = "metadata"
    el.volume = volume
    audioRef.current = el

    const onTime = () => setCurrentTime(el.currentTime)
    const onMeta = () => setDuration(el.duration || 0)
    const onEnd = () => setIsPlaying(false)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    el.addEventListener("timeupdate", onTime)
    el.addEventListener("loadedmetadata", onMeta)
    el.addEventListener("ended", onEnd)
    el.addEventListener("play", onPlay)
    el.addEventListener("pause", onPause)

    return () => {
      el.pause()
      el.removeEventListener("timeupdate", onTime)
      el.removeEventListener("loadedmetadata", onMeta)
      el.removeEventListener("ended", onEnd)
      el.removeEventListener("play", onPlay)
      el.removeEventListener("pause", onPause)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const play = useCallback(
    (track: PlayableTrack) => {
      const el = audioRef.current
      if (!el) return
      if (current?.id === track.id) {
        if (el.paused) void el.play()
        else el.pause()
        return
      }
      setCurrent(track)
      el.src = track.audioUrl
      el.load()
      void el.play().catch(() => setIsPlaying(false))
    },
    [current],
  )

  const toggle = useCallback(() => {
    const el = audioRef.current
    if (!el || !current) return
    if (el.paused) void el.play()
    else el.pause()
  }, [current])

  const seek = useCallback(
    (fraction: number) => {
      const el = audioRef.current
      if (!el || !duration) return
      el.currentTime = fraction * duration
      setCurrentTime(el.currentTime)
    },
    [duration],
  )

  const setVolume = useCallback((v: number) => {
    const el = audioRef.current
    setVolumeState(v)
    if (el) el.volume = v
  }, [])

  const value: AudioContextValue = {
    current,
    isPlaying,
    progress: duration ? currentTime / duration : 0,
    currentTime,
    duration,
    volume,
    play,
    toggle,
    seek,
    setVolume,
  }

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>
}
