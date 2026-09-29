"use client"

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import type { PlayableTrack } from "@/lib/broadcast"
import type { TvArtistContext } from "@/lib/types"
import { shuffleCycle } from "@/lib/shuffle"
export type { PlayableTrack } from "@/lib/broadcast"

export type RepeatMode = "off" | "all" | "one"
type Owner = "music" | "video" | "browsing" | "off"
type Session = {
  kind: "station" | "queue" | "exclusive"
  artistSlug: string | null
  tracks: PlayableTrack[]
  index: number
  remaining: number[]
  time: number
  shuffle: boolean
  repeat: RepeatMode
  failed: Set<number>
}
interface AudioContextValue {
  current: PlayableTrack | null
  stationArtistSlug: string | null
  stationMode: boolean
  playbackMode: Session["kind"] | null
  owner: Owner
  isPlaying: boolean
  needsGesture: boolean
  mediaError: boolean
  progress: number
  currentTime: number
  duration: number
  volume: number
  shuffle: boolean
  repeatMode: RepeatMode
  queueLength: number
  play: (track: PlayableTrack) => void
  playQueue: (tracks: PlayableTrack[], startIndex: number) => void
  selectTrack: (index: number) => void
  nextTrack: () => void
  previousTrack: () => void
  startStation: (artistSlug: string, tracks: PlayableTrack[], preferredTrackId?: string, fresh?: boolean, autoplay?: boolean) => void
  playExclusive: (track: PlayableTrack) => void
  restoreStation: (resume?: boolean) => void
  suspend: (owner: "video" | "browsing" | "off") => void
  releaseVideo: () => void
  pause: () => void
  resume: () => void
  toggle: () => void
  seek: (fraction: number) => void
  setVolume: (v: number) => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  tvPoweredOn: boolean
  tvChannel: number | null
  tvMode: "music" | "video"
  setTvPoweredOn: (value: boolean) => void
  setTvChannel: (value: number) => void
  setTvMode: (value: "music" | "video") => void
  tvArtistContext: TvArtistContext
  setTvArtistContext: (value: TvArtistContext) => void
  lastOfficialArtistSlug: string
}
const AudioCtx = createContext<AudioContextValue | null>(null)
export function useAudio() {
  const ctx = useContext(AudioCtx)
  if (!ctx) throw new Error("useAudio must be used within AudioProvider")
  return ctx
}
export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audio = useRef<HTMLAudioElement | null>(null)
  const session = useRef<Session | null>(null)
  const station = useRef<Session | null>(null)
  const stations = useRef(new Map<string, Session>())
  const ownerRef = useRef<Owner>("music")
  const generation = useRef(0)
  const volumeRef = useRef(0.8)
  const [, render] = useState(0)
  const [owner, setOwner] = useState<Owner>("music")
  const [isPlaying, setPlaying] = useState(false)
  const [needsGesture, setNeedsGesture] = useState(false)
  const [mediaError, setMediaError] = useState(false)
  const [currentTime, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.8)
  const [tvPoweredOn, setTvPoweredOn] = useState(false)
  const [tvChannel, setTvChannel] = useState<number | null>(null)
  const [tvMode, setTvMode] = useState<"music" | "video">("music")
  const [tvArtistContext, setTvArtistContextState] = useState<TvArtistContext>({ kind: "official", slug: "danoot" })
  const [lastOfficialArtistSlug, setLastOfficialArtistSlug] = useState("danoot")
  const setTvArtistContext = useCallback((value: TvArtistContext) => {
    setTvArtistContextState(value)
    if (value.kind === "official") setLastOfficialArtistSlug(value.slug)
  }, [])
  const refresh = useCallback(() => render((n) => n + 1), [])
  const element = useCallback(() => {
    if (!audio.current) {
      audio.current = new Audio()
      audio.current.preload = "metadata"
      audio.current.volume = volumeRef.current
    }
    return audio.current
  }, [])
  const pause = useCallback(() => {
    generation.current++
    if (session.current && audio.current) session.current.time = audio.current.currentTime || 0
    audio.current?.pause()
    setPlaying(false)
  }, [])
  const resume = useCallback(() => {
    const el = audio.current
    if (!el || ownerRef.current !== "music" || !session.current?.tracks.length) return
    const token = ++generation.current
    setNeedsGesture(false)
    void el.play().then(() => {
      if (token === generation.current && ownerRef.current === "music") setPlaying(true)
    }).catch((error: DOMException) => {
      if (token !== generation.current) return
      setPlaying(false)
      if (error.name === "NotAllowedError") setNeedsGesture(true)
    })
  }, [])
  // Each load captures its session/source; late events cannot advance another station.
  const load = useCallback(function loadSession(autoplay: boolean) {
    const el = element()
    generation.current++
    el.onended = el.onerror = el.onloadedmetadata = el.ontimeupdate = el.onplay = el.onpause = null
    el.pause()
    setPlaying(false)
    setNeedsGesture(false)
    setMediaError(false)
    const active = session.current
    const track = active?.tracks[active.index]
    setTime(active?.time ?? 0)
    setDuration(0)
    refresh()
    if (!active || !track) {
      el.removeAttribute("src")
      el.load()
      return
    }
    const index = active.index
    const restoreTime = active.time
    const valid = () => session.current === active && active.index === index && el.getAttribute("src") === track.audioUrl
    el.src = track.audioUrl
    el.onloadedmetadata = () => {
      if (!valid()) return
      setDuration(Number.isFinite(el.duration) ? el.duration : 0)
      if (restoreTime) el.currentTime = Math.min(restoreTime, Number.isFinite(el.duration) ? el.duration : restoreTime)
    }
    el.ontimeupdate = () => {
      if (!valid()) return
      active.time = el.currentTime
      setTime(el.currentTime)
    }
    el.onplay = () => {
      if (!valid() || ownerRef.current !== "music") { el.pause(); return }
      setPlaying(true)
      setNeedsGesture(false)
    }
    el.onpause = () => { if (valid()) setPlaying(false) }
    const advance = (failed: boolean) => {
      if (!valid() || ownerRef.current !== "music") return
      if (failed) active.failed.add(index)
      else active.failed.clear()
      if (active.failed.size >= active.tracks.length) {
        setMediaError(true)
        setPlaying(false)
        return
      }
      let next: number | undefined
      if (!failed && active.repeat === "one") next = index
      else if (active.shuffle) {
        if (!active.remaining.length && active.repeat === "all") active.remaining = shuffleCycle(active.tracks.length, index)
        next = active.remaining.shift()
        while (next !== undefined && active.failed.has(next)) next = active.remaining.shift()
        if (next === undefined && failed && active.repeat === "all") {
          active.remaining = shuffleCycle(active.tracks.length, index).filter((i) => !active.failed.has(i))
          next = active.remaining.shift()
        }
      } else next = index + 1 < active.tracks.length ? index + 1 : active.repeat === "all" ? 0 : undefined
      if (next === undefined) { setPlaying(false); if (failed) setMediaError(true); return }
      active.index = next
      active.time = 0
      loadSession(true)
    }
    el.onended = () => { if (el.ended) advance(false) }
    el.onerror = () => { if (el.error) advance(true) }
    el.load()
    if (autoplay && ownerRef.current === "music") resume()
  }, [element, refresh, resume])
  const claimMusic = useCallback(() => {
    ownerRef.current = "music"
    setOwner("music")
  }, [])
  const startStation = useCallback((artistSlug: string, tracks: PlayableTrack[], preferredTrackId?: string, fresh = false, autoplay = true) => {
    const active = session.current
    if (active?.kind === "station" && active.artistSlug) stations.current.set(active.artistSlug, active)
    const retained = stations.current.get(artistSlug)
    const same = retained?.artistSlug === artistSlug && retained.tracks.length === tracks.length &&
      retained.tracks.every((track, i) => track.id === tracks[i].id && track.audioUrl === tracks[i].audioUrl)
    // Return to a cached artist station without replacing its queue or shuffle state.
    if (same && !fresh && !preferredTrackId && session.current === retained) {
      station.current = retained
      claimMusic()
      refresh()
      if (autoplay && audio.current?.paused) resume()
      return
    }
    if (same && !fresh && !preferredTrackId) {
      pause()
      claimMusic()
      station.current = retained
      session.current = retained
      load(autoplay)
      return
    }
    pause()
    claimMusic()
    const order = shuffleCycle(tracks.length)
    const preferred = tracks.findIndex((track) => track.id === preferredTrackId)
    const index = preferred >= 0 ? preferred : order.shift() ?? 0
    const next: Session = {
      kind: "station", artistSlug, tracks, index,
      remaining: preferred >= 0 ? order.filter((i) => i !== preferred) : order,
      time: 0, shuffle: true, repeat: "all", failed: new Set(),
    }
    stations.current.set(artistSlug, next)
    station.current = session.current = next
    load(autoplay)
  }, [pause, claimMusic, refresh, resume, load])
  const restoreStation = useCallback((autoplay = true) => {
    pause()
    claimMusic()
    const alreadyLoaded = session.current === station.current
    session.current = station.current
    if (alreadyLoaded) { refresh(); if (autoplay) resume() } else load(autoplay)
  }, [pause, claimMusic, refresh, resume, load])
  const suspend = useCallback((nextOwner: "video" | "browsing" | "off") => {
    pause()
    ownerRef.current = nextOwner
    setOwner(nextOwner)
  }, [pause])
  const releaseVideo = useCallback(() => {
    if (ownerRef.current === "video") restoreStation(false)
  }, [restoreStation])
  const playExclusive = useCallback((track: PlayableTrack) => {
    pause()
    claimMusic()
    session.current = { kind: "exclusive", artistSlug: track.artistSlug ?? null, tracks: [track], index: 0, remaining: [], time: 0, shuffle: false, repeat: "off", failed: new Set() }
    load(true)
  }, [pause, claimMusic, load])
  const playQueue = useCallback((tracks: PlayableTrack[], index: number) => {
    if (ownerRef.current !== "music" || !tracks[index]) return
    pause()
    const prior = session.current
    const shuffle = prior?.kind === "queue" ? prior.shuffle : false
    const repeat = prior?.kind === "queue" ? prior.repeat : "off"
    station.current = null
    session.current = { kind: "queue", artistSlug: null, tracks, index, remaining: shuffleCycle(tracks.length).filter((i) => i !== index), time: 0, shuffle, repeat, failed: new Set() }
    load(true)
  }, [pause, load])
  const selectTrack = useCallback((index: number) => {
    const active = session.current
    if (ownerRef.current !== "music" || !active || (active.kind !== "station" && active.kind !== "queue") || !active.tracks[index]) return
    pause()
    active.index = index
    active.time = 0
    active.failed.clear()
    active.remaining = active.shuffle ? shuffleCycle(active.tracks.length).filter((i) => i !== index) : []
    load(true)
  }, [pause, load])
  const nextTrack = useCallback(() => {
    if (ownerRef.current !== "music") return
    const active = session.current
    if (active?.kind === "station" && active.shuffle) {
      const next = active.remaining.shift() ?? (active.repeat === "all" ? shuffleCycle(active.tracks.length, active.index).shift() : undefined)
      if (next !== undefined) { pause(); active.index = next; active.time = 0; load(true) }
      return
    }
    if (active?.tracks.length) selectTrack(active.index + 1 < active.tracks.length ? active.index + 1 : active.repeat === "all" ? 0 : active.index)
  }, [load, pause, selectTrack])
  const previousTrack = useCallback(() => {
    const active = session.current
    if (active?.tracks.length) selectTrack(active.index > 0 ? active.index - 1 : active.repeat === "all" ? active.tracks.length - 1 : active.index)
  }, [selectTrack])
  const toggle = useCallback(() => {
    if (ownerRef.current !== "music") return
    if (audio.current?.paused) resume()
    else pause()
  }, [pause, resume])
  const play = useCallback((track: PlayableTrack) => {
    if (ownerRef.current !== "music") return
    if (session.current?.tracks[session.current.index]?.id === track.id) toggle()
    else playQueue([track], 0)
  }, [toggle, playQueue])
  const seek = useCallback((fraction: number) => {
    const el = audio.current
    if (ownerRef.current !== "music" || !el || !Number.isFinite(el.duration)) return
    el.currentTime = Math.max(0, Math.min(1, fraction)) * el.duration
    if (session.current) session.current.time = el.currentTime
    setTime(el.currentTime)
  }, [])
  const setVolume = useCallback((value: number) => {
    const next = Math.max(0, Math.min(1, value))
    const wasOff = volumeRef.current === 0
    volumeRef.current = next
    setVolumeState(next)
    if (audio.current) audio.current.volume = next
    if (wasOff && next > 0 && ownerRef.current === "music" && audio.current?.paused) resume()
  }, [resume])
  const toggleShuffle = useCallback(() => {
    const s = session.current
    if (ownerRef.current !== "music" || !s || (s.kind !== "queue" && s.kind !== "station") || s.tracks.length < 2) return
    s.shuffle = !s.shuffle
    s.remaining = shuffleCycle(s.tracks.length).filter((i) => i !== s.index)
    refresh()
  }, [refresh])
  const cycleRepeat = useCallback(() => {
    const s = session.current
    if (ownerRef.current !== "music" || !s || (s.kind !== "queue" && s.kind !== "station")) return
    s.repeat = s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off"
    refresh()
  }, [refresh])
  useEffect(() => {
    // Reconnect after React's development effect replay as well as initial setup.
    if (session.current) load(ownerRef.current === "music")
    return () => {
      generation.current++
      const el = audio.current
      if (el) {
        el.onended = el.onerror = el.onloadedmetadata = el.ontimeupdate = el.onplay = el.onpause = null
        el.pause()
      }
    }
  }, [load])
  const active = session.current
  return <AudioCtx.Provider value={{
    current: active?.tracks[active.index] ?? null,
    stationArtistSlug: station.current?.artistSlug ?? null,
    stationMode: active?.kind === "station",
    playbackMode: active?.kind ?? null,
    owner, isPlaying, needsGesture, mediaError, currentTime, duration, volume,
    progress: duration ? currentTime / duration : 0,
    shuffle: active?.shuffle ?? false, repeatMode: active?.repeat ?? "off", queueLength: active?.tracks.length ?? 0,
    startStation, playExclusive, restoreStation, suspend, releaseVideo, pause, resume,
    play, playQueue, selectTrack, nextTrack, previousTrack, toggle, seek, setVolume, toggleShuffle, cycleRepeat,
    tvPoweredOn, tvChannel, tvMode, setTvPoweredOn, setTvChannel, setTvMode, tvArtistContext, setTvArtistContext, lastOfficialArtistSlug,
  }}>{children}</AudioCtx.Provider>
}
