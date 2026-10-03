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
  sourceTracks: PlayableTrack[]
  tracks: PlayableTrack[]
  index: number
  remaining: number[]
  time: number
  shuffle: boolean
  repeat: RepeatMode
  failed: Set<number>
}
function reshuffleSession(active: Session, includePlayed = false) {
  if (active.tracks.length < 2) return
  const current = active.tracks[active.index]
  const past = includePlayed ? [] : active.tracks.slice(0, active.index)
  const upcoming = includePlayed ? active.tracks.filter((_, index) => index !== active.index) : active.tracks.slice(active.index + 1)
  const order = shuffleCycle(upcoming.length)
  const shuffled = order.map((index) => upcoming[index])
  if (shuffled.length > 1 && shuffled.every((track, index) => track.id === upcoming[index].id)) shuffled.push(shuffled.shift()!)
  active.tracks = [...past, current, ...shuffled]
  active.index = past.length
  active.remaining = []
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
  playExclusive: (track: PlayableTrack, queue?: PlayableTrack[]) => void
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
      else next = index + 1 < active.tracks.length ? index + 1 : active.repeat === "all" ? 0 : undefined
      while (next !== undefined && active.failed.has(next) && next !== index) {
        next = next + 1 < active.tracks.length ? next + 1 : active.repeat === "all" ? 0 : undefined
      }
      if (next === index && active.failed.has(index)) next = undefined
      if (next === undefined && active.shuffle && active.repeat === "all" && failed) {
        reshuffleSession(active, true)
        next = active.tracks.findIndex((_, trackIndex) => trackIndex > active.index && !active.failed.has(trackIndex))
      }
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
      retained.tracks.every((track) => tracks.some((candidate) => track.id === candidate.id && track.audioUrl === candidate.audioUrl))
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
    const trackOrder = preferred >= 0 ? [preferred, ...order.filter((i) => i !== preferred)] : order
    const next: Session = {
      kind: "station", artistSlug, sourceTracks: [...tracks], tracks: trackOrder.map((i) => tracks[i]), index: 0, remaining: [],
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
  const playExclusive = useCallback((track: PlayableTrack, queue: PlayableTrack[] = [track]) => {
    const prior = session.current
    const sameQueue = prior?.kind === "exclusive" && prior.tracks.length === queue.length &&
      prior.tracks.every((item) => queue.some((candidate) => candidate.id === item.id && candidate.audioUrl === item.audioUrl))
    const tracks = sameQueue ? prior.tracks : [...queue]
    const index = tracks.findIndex((item) => item.id === track.id)
    if (index < 0) return
    pause()
    claimMusic()
    session.current = {
      kind: "exclusive", artistSlug: track.artistSlug ?? null, sourceTracks: sameQueue ? prior.sourceTracks : [...queue], tracks, index, remaining: [], time: 0,
      shuffle: sameQueue ? prior.shuffle : false, repeat: sameQueue ? prior.repeat : "off", failed: sameQueue ? prior.failed : new Set(),
    }
    load(true)
  }, [pause, claimMusic, load])
  const playQueue = useCallback((tracks: PlayableTrack[], index: number) => {
    if (ownerRef.current !== "music" || !tracks[index]) return
    pause()
    const prior = session.current
    const shuffle = prior?.kind === "queue" ? prior.shuffle : false
    const repeat = prior?.kind === "queue" ? prior.repeat : "off"
    const rest = tracks.filter((_, i) => i !== index)
    const trackOrder = shuffle ? [tracks[index], ...shuffleCycle(rest.length).map((i) => rest[i])] : tracks
    session.current = { kind: "queue", artistSlug: null, sourceTracks: [...tracks], tracks: trackOrder, index: shuffle ? 0 : index, remaining: [], time: 0, shuffle, repeat, failed: new Set() }
    load(true)
  }, [pause, load])
  const selectTrack = useCallback((index: number) => {
    const active = session.current
    if (ownerRef.current !== "music" || !active || !active.tracks[index]) return
    pause()
    active.index = index
    active.time = 0
    active.failed.clear()
    active.remaining = []
    load(true)
  }, [pause, load])
  const nextTrack = useCallback(() => {
    if (ownerRef.current !== "music") return
    const active = session.current
    if (!active?.tracks.length) return
    if (active.index + 1 < active.tracks.length) selectTrack(active.index + 1)
    else if (active.repeat === "all") {
      if (active.shuffle && active.tracks.length > 1) {
        reshuffleSession(active, true)
        active.index = 1
        active.time = 0
        load(true)
      } else selectTrack(0)
    }
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
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return
      const target = event.target as HTMLElement | null
      // Editing keeps Space input; elsewhere reserve it before any focused control.
      if (target?.isContentEditable || target?.closest?.("input, textarea, select, [contenteditable]")) return
      const alreadyHandled = event.defaultPrevented
      event.preventDefault()
      event.stopPropagation()
      const focused = document.activeElement as HTMLElement | null
      if (focused?.matches("[data-tv-remote] button, [data-audio-player] button")) focused.blur()
      // Cancel native activation even while silent or repeating, but toggle only once.
      if (event.repeat || alreadyHandled || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (ownerRef.current !== "music" || !session.current?.tracks[session.current.index] || !audio.current) return
      toggle()
    }
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [toggle])
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
    if (ownerRef.current !== "music" || !s || s.tracks.length < 2) return
    const current = s.tracks[s.index]
    if (s.shuffle) {
      s.shuffle = false
      s.tracks = [...s.sourceTracks]
      s.index = s.tracks.findIndex((track) => track.id === current.id && track.audioUrl === current.audioUrl)
      s.remaining = []
    } else {
      const upcoming = s.sourceTracks.filter((track) => track.id !== current.id || track.audioUrl !== current.audioUrl)
      const shuffled = shuffleCycle(upcoming.length).map((index) => upcoming[index])
      if (shuffled.length > 1 && shuffled.every((track, index) => track.id === upcoming[index].id)) shuffled.push(shuffled.shift()!)
      s.shuffle = true
      s.tracks = [current, ...shuffled]
      s.index = 0
      s.remaining = []
    }
    refresh()
  }, [refresh])
  const cycleRepeat = useCallback(() => {
    const s = session.current
    if (ownerRef.current !== "music" || !s) return
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
