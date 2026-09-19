"use client"

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"

export interface PlayableTrack {
  id: string
  title: string
  artist: string
  artwork: string
  audioUrl: string
}

export type RepeatMode = "off" | "all" | "one"

interface AudioContextValue {
  current: PlayableTrack | null
  isPlaying: boolean
  progress: number // 0..1
  currentTime: number
  duration: number
  volume: number
  play: (track: PlayableTrack) => void
  playQueue: (tracks: PlayableTrack[], startIndex: number) => void
  toggle: () => void
  seek: (fraction: number) => void
  setVolume: (v: number) => void
  shuffle: boolean
  repeatMode: RepeatMode
  queueLength: number
  toggleShuffle: () => void
  cycleRepeat: () => void
}

const AudioCtx = createContext<AudioContextValue | null>(null)

function shuffledRemaining(length: number, currentIndex: number) {
  const remaining = Array.from({ length }, (_, index) => index).filter((index) => index !== currentIndex)
  for (let index = remaining.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[remaining[index], remaining[randomIndex]] = [remaining[randomIndex], remaining[index]]
  }
  return remaining
}

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
  const [queue, setQueue] = useState<PlayableTrack[]>([])
  const [shuffle, setShuffle] = useState(false)
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off")
  const currentRef = useRef<PlayableTrack | null>(null)
  const queueRef = useRef<PlayableTrack[]>([])
  const currentIndexRef = useRef(0)
  const shuffleRef = useRef(false)
  const shuffleRemainingRef = useRef<number[]>([])
  const repeatModeRef = useRef<RepeatMode>("off")

  const startAt = useCallback((index: number) => {
    const el = audioRef.current
    const track = queueRef.current[index]
    if (!el || !track) return
    currentIndexRef.current = index
    currentRef.current = track
    setCurrent(track)
    setCurrentTime(0)
    setDuration(0)
    el.src = track.audioUrl
    el.load()
    void el.play().catch(() => setIsPlaying(false))
  }, [])

  useEffect(() => {
    const el = new Audio()
    el.preload = "metadata"
    el.volume = volume
    audioRef.current = el

    const onTime = () => setCurrentTime(el.currentTime)
    const onMeta = () => setDuration(el.duration || 0)
    const onEnd = () => {
      const mode = repeatModeRef.current
      if (mode === "one") {
        el.currentTime = 0
        void el.play().catch(() => setIsPlaying(false))
        return
      }
      const tracks = queueRef.current
      if (shuffleRef.current && tracks.length > 1) {
        if (!shuffleRemainingRef.current.length && mode === "all") {
          shuffleRemainingRef.current = shuffledRemaining(tracks.length, currentIndexRef.current)
        }
        const next = shuffleRemainingRef.current.shift()
        if (next !== undefined) {
          startAt(next)
          return
        }
      } else {
        const next = currentIndexRef.current + 1
        if (next < tracks.length) {
          startAt(next)
          return
        }
        if (mode === "all" && tracks.length) {
          startAt(0)
          return
        }
      }
      setIsPlaying(false)
    }
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
  }, [startAt])

  const playQueue = useCallback((tracks: PlayableTrack[], startIndex: number) => {
    if (!tracks.length || startIndex < 0 || startIndex >= tracks.length) return
    queueRef.current = tracks
    setQueue(tracks)
    shuffleRemainingRef.current = shuffleRef.current ? shuffledRemaining(tracks.length, startIndex) : []
    startAt(startIndex)
  }, [startAt])

  const play = useCallback(
    (track: PlayableTrack) => {
      const el = audioRef.current
      if (!el) return
      if (currentRef.current?.id === track.id) {
        if (el.paused) void el.play()
        else el.pause()
        return
      }
      queueRef.current = [track]
      setQueue([track])
      shuffleRemainingRef.current = []
      startAt(0)
    },
    [startAt],
  )

  const toggle = useCallback(() => {
    const el = audioRef.current
    if (!el || !currentRef.current) return
    if (el.paused) void el.play()
    else el.pause()
  }, [])

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

  const toggleShuffle = useCallback(() => {
    if (queueRef.current.length < 2) return
    const next = !shuffleRef.current
    shuffleRef.current = next
    shuffleRemainingRef.current = next ? shuffledRemaining(queueRef.current.length, currentIndexRef.current) : []
    setShuffle(next)
  }, [])

  const cycleRepeat = useCallback(() => {
    setRepeatMode((mode) => {
      const next = mode === "off" ? "all" : mode === "all" ? "one" : "off"
      repeatModeRef.current = next
      return next
    })
  }, [])

  const value: AudioContextValue = {
    current,
    isPlaying,
    progress: duration ? currentTime / duration : 0,
    currentTime,
    duration,
    volume,
    play,
    playQueue,
    toggle,
    seek,
    setVolume,
    shuffle,
    repeatMode,
    queueLength: queue.length,
    toggleShuffle,
    cycleRepeat,
  }

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>
}
