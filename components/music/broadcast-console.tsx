"use client"

import Image from "next/image"
import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from "react"

import { artists, releases } from "@/lib/data"
import { archiveArtists } from "@/lib/archive"
import type { TvArtistContext } from "@/lib/types"
import { artistPlaylist } from "@/lib/broadcast"
import { BroadcastVideo, type VideoControls } from "./broadcast-video"
import { YouTubePlayer, type YouTubeControls } from "./youtube-player"
import { useAudio } from "@/components/audio/audio-provider"

const lightByChannel = [
  { glow: "rgba(159, 192, 151, 0.32)", edge: "rgba(202, 176, 98, 0.11)", haze: "rgba(128, 151, 103, 0.12)" },
  { glow: "rgba(123, 170, 157, 0.34)", edge: "rgba(62, 87, 119, 0.13)", haze: "rgba(66, 102, 94, 0.13)" },
  { glow: "rgba(203, 181, 111, 0.28)", edge: "rgba(140, 92, 50, 0.12)", haze: "rgba(161, 133, 77, 0.12)" },
]

type PowerPhase = "on" | "starting" | "stopping" | "off"
type Mode = "music" | "video"
type OptionsCategory = "singles" | "projects"
type Screen = "broadcast" | "options-categories" | "options-release-list" | "options-tracks" | "video-list" | "video-player" | "archive-list" | "exclusive-artists" | "exclusive-list" | "exclusive-item"
type RemoteDestination = "music" | "videos" | "options" | "archive" | "exclusive"
function isRemoteDestinationActive(destination: RemoteDestination, tv: TvState) {
  switch (destination) {
    case "music": return tv.screen === "broadcast" && tv.mode === "music"
    case "videos": return tv.screen === "video-list" || tv.screen === "video-player"
    case "options": return tv.screen.startsWith("options-")
    case "archive": return tv.screen === "archive-list"
    case "exclusive": return tv.screen.startsWith("exclusive-")
  }
}
function destinationAllowsStation(screen: Screen, mode: Mode) {
  return (screen === "broadcast" && mode === "music") || screen.startsWith("options-")
}
function canOpenMusicOptions(tv: TvState) {
  const context = tv.artistContext
  const validArtist = context.kind === "official"
    ? artists.some((artist) => artist.slug === context.slug)
    : archiveArtists.some((artist) => artist.id === context.id)
  return validArtist &&
    ((tv.screen === "broadcast" && tv.mode === "music") || tv.screen.startsWith("options-"))
}
const exclusiveArtistSlugs = ["moxli", "danoot", "matei"] as const
type TvState = { channel: number; artistContext: TvArtistContext; mode: Mode; screen: Screen; cursor: number; archive: number; exclusive: number; exclusiveArtistSlug: string; optionsCategory: OptionsCategory; optionsReleaseSlug: string | null; video: number }
type TvAction =
  | { type: "broadcast"; mode: Mode; channel?: number }
  | { type: "channel"; channel: number; slug: string; exitArchive: boolean }
  | { type: "archive-channel"; id: string; index: number; screen: Screen }
  | { type: "open-archive"; index: number }
  | { type: "screen"; screen: Screen }
  | { type: "options-category"; category: OptionsCategory }
  | { type: "options-release"; slug: string }
  | { type: "video-select"; index: number }
  | { type: "cursor"; direction: number; count: number }
  | { type: "select" }
  | { type: "back" }
function tvReducer(state: TvState, action: TvAction): TvState {
  switch (action.type) {
    case "broadcast": return { ...state, channel: action.channel ?? state.channel, mode: action.mode, screen: "broadcast", cursor: 0 }
    case "channel": return action.exitArchive
      ? { ...state, channel: action.channel, artistContext: { kind: "official", slug: action.slug }, mode: "music", screen: "broadcast", cursor: 0 }
      : { ...state, channel: action.channel, artistContext: { kind: "official", slug: action.slug }, cursor: 0 }
    case "archive-channel": return { ...state, artistContext: { kind: "archive", id: action.id }, archive: action.index, screen: action.screen, cursor: 0 }
    case "screen": return { ...state, screen: action.screen, cursor: action.screen === "archive-list" ? state.archive : 0 }
    case "open-archive": return { ...state, screen: "archive-list", archive: action.index, cursor: action.index }
    case "options-category": return { ...state, screen: "options-release-list", optionsCategory: action.category, cursor: 0, optionsReleaseSlug: null }
    case "options-release": return { ...state, screen: "options-tracks", optionsReleaseSlug: action.slug, cursor: 0 }
    case "video-select": return { ...state, screen: "video-player", video: action.index }
    case "cursor": return action.count ? { ...state, cursor: (state.cursor + action.direction + action.count) % action.count } : state
    case "select": return state.screen === "archive-list"
      ? { ...state, artistContext: { kind: "archive", id: archiveArtists[state.cursor].id }, archive: state.cursor, mode: "music", screen: "broadcast", cursor: 0 }
      : state.screen === "exclusive-artists" ? { ...state, screen: "exclusive-list", exclusiveArtistSlug: exclusiveArtistSlugs[state.cursor], cursor: 0 }
      : state.screen === "exclusive-list" ? { ...state, screen: "exclusive-item", exclusive: state.cursor } : state
    case "back": return state.screen === "options-tracks" ? { ...state, screen: "options-release-list", cursor: 0 }
      : state.screen === "options-release-list" ? { ...state, screen: "options-categories", cursor: state.optionsCategory === "singles" ? 0 : 1 }
      : state.screen === "options-categories" ? { ...state, screen: "broadcast", cursor: 0 }
      : state.screen === "video-player" ? { ...state, screen: "video-list", cursor: state.video }
      : state.screen === "video-list" ? { ...state, screen: "broadcast", mode: "music", cursor: 0 }
      : state.screen === "exclusive-item" ? { ...state, screen: "exclusive-list", cursor: state.exclusive }
      : state.screen === "exclusive-list" ? { ...state, screen: "exclusive-artists", cursor: exclusiveArtistSlugs.findIndex((slug) => slug === state.exclusiveArtistSlug) }
      : { ...state, screen: "broadcast" }
  }
}
const VOLUME_KNOB_SIZE = 44
const VOLUME_KNOB_INSET = VOLUME_KNOB_SIZE / 2
export function BroadcastConsole() {
  const { volume, setVolume, current, owner, stationMode, stationArtistSlug, needsGesture, mediaError,
    startStation, restoreStation, playExclusive, suspend, resume, previousTrack, nextTrack, selectTrack,
    tvPoweredOn, tvChannel, tvMode, setTvPoweredOn, setTvChannel, setTvMode, tvArtistContext, setTvArtistContext,
    lastOfficialArtistSlug } = useAudio()
  const persistedChannel = tvChannel ?? Math.max(0, artists.findIndex((artist) => artist.slug === stationArtistSlug))
  const [tv, dispatch] = useReducer(tvReducer, {
    artistContext: tvArtistContext,
    channel: persistedChannel,
    mode: tvMode, screen: "broadcast", cursor: 0, archive: 0, exclusive: 0, exclusiveArtistSlug: "moxli", optionsCategory: "singles", optionsReleaseSlug: null, video: 0,
  })
  const [powerOn, setPowerOn] = useState(tvPoweredOn)
  const [powerPhase, setPowerPhase] = useState<PowerPhase>(tvPoweredOn ? "on" : "off")
  const phaseRef = useRef<PowerPhase>(powerPhase)
  const tvRef = useRef(tv)
  tvRef.current = tv
  const [transitioning, setTransitioning] = useState(false)
  const [transitionId, setTransitionId] = useState(0)
  const [signalActive, setSignalActive] = useState(false)
  const [flashActive, setFlashActive] = useState(false)
  const remoteRef = useRef<HTMLDivElement | null>(null)
  const transitionTimerRef = useRef<number | null>(null)
  const powerTimerRef = useRef<number | null>(null)
  const volumeBarRef = useRef<HTMLDivElement | null>(null)
  const exclusiveVideoRef = useRef<VideoControls | null>(null)
  const youtubeRef = useRef<YouTubeControls | null>(null)
  const initialized = useRef(false)
  const specialReturnVideoScreen = useRef<"video-list" | "video-player">("video-list")
  const selectedChannel = tv.channel
  const artistContext = tv.artistContext
  const activeArtist = artistContext.kind === "official"
    ? artists.find((artist) => artist.slug === artistContext.slug) ?? artists[selectedChannel]
    : archiveArtists.find((artist) => artist.id === artistContext.id) ?? archiveArtists[0]
  const activeArtistSlug = artistContext.kind === "official" ? artistContext.slug : artistContext.id
  const activeReleaseSlugs = activeArtist.releaseSlugs
  const activeVideos = activeArtist.videos
  const light = lightByChannel[selectedChannel]
  const identity = activeArtist.name
  const channelLabel = `CH ${String(selectedChannel + 1).padStart(2, "0")}`
  const exclusiveArtist = artists.find((artist) => artist.slug === tv.exclusiveArtistSlug)!
  const exclusive = exclusiveArtist.exclusives[tv.exclusive]
  const musicTrack = current?.artistSlug === activeArtistSlug ? current : null
  const optionsReleases = releases.filter((release) => activeReleaseSlugs.includes(release.slug) && (tv.optionsCategory === "singles" ? release.type === "Single" : release.type !== "Single"))
  const optionsRelease = releases.find((release) => release.slug === tv.optionsReleaseSlug && activeReleaseSlugs.includes(release.slug))
  const video = activeVideos[tv.video]

  useEffect(() => {
    // Power, channel, and the station session live in AudioProvider, which survives route changes.
    // A fresh console reflects that state without rebuilding or restarting the station.
    phaseRef.current = tvPoweredOn ? "on" : "off"
    setPowerOn(tvPoweredOn)
    setPowerPhase(tvPoweredOn ? "on" : "off")
    if (tvPoweredOn) {
      if (tvChannel === null) setTvChannel(persistedChannel)
      if (tv.mode !== "music" || tv.screen !== "broadcast" || tv.channel !== persistedChannel) {
        dispatch({ type: "broadcast", channel: persistedChannel, mode: "music" })
      }
      setTvMode("music")
      setTvArtistContext(tvArtistContext)
      if (stationMode && owner !== "music") restoreStation(false)
    }
    // This is intentionally mount-only: route unmounts are not power events.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const params = new URLSearchParams(window.location.search)
    const requestedArtist = artists.findIndex((artist) => artist.slug === params.get("artist"))
    const requestedRelease = releases.find((release) => release.slug === params.get("release") && release.artistSlug === params.get("artist"))
    if (params.get("tv") === "1" && requestedArtist >= 0 && (!params.has("release") ||
      (requestedRelease && artists[requestedArtist].releaseSlugs.includes(requestedRelease.slug)))) {
      const artist = artists[requestedArtist]
      const tracks = artistPlaylist(artist, releases)
      const preferred = tracks.find((track) => track.releaseSlug === requestedRelease?.slug)?.id
      dispatch({ type: "channel", channel: requestedArtist, slug: artist.slug, exitArchive: true })
      phaseRef.current = "on"
      setPowerOn(true)
      setPowerPhase("on")
      setTvPoweredOn(true)
      setTvChannel(requestedArtist)
      setTvMode("music")
      setTvArtistContext({ kind: "official", slug: artist.slug })
      startStation(artist.slug, tracks, preferred, true)
      for (const key of ["tv", "artist", "mode", "view", "release"]) params.delete(key)
      const query = params.toString()
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash || "#broadcast"}`)
    }
  }, [startStation, stationArtistSlug])

  useEffect(() => () => {
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current)
    if (powerTimerRef.current !== null) window.clearTimeout(powerTimerRef.current)
  }, [])
  useEffect(() => {
    const remote = remoteRef.current

    if (!remote) return

    const reducedMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches

    const touch =
      window.matchMedia(
        "(pointer: coarse)"
      ).matches

    if (reducedMotion || touch) return

    const handleMove = (
      event: PointerEvent
    ) => {
      const rect =
        remote.getBoundingClientRect()

      const x =
        ((event.clientX - rect.left) /
          rect.width -
          0.5) *
        2

      const y =
        ((event.clientY - rect.top) /
          rect.height -
          0.5) *
        2

      remote.style.setProperty(
        "--rx",
        `${y * -5}deg`
      )

      remote.style.setProperty(
        "--ry",
        `${x * 7}deg`
      )

      remote.style.setProperty(
        "--tx",
        `${x * 4}px`
      )

      remote.style.setProperty(
        "--ty",
        `${y * 4}px`
      )
    }

    const handleLeave = () => {
      remote.style.setProperty(
        "--rx",
        "0deg"
      )

      remote.style.setProperty(
        "--ry",
        "0deg"
      )

      remote.style.setProperty(
        "--tx",
        "0px"
      )

      remote.style.setProperty(
        "--ty",
        "0px"
      )
    }

    remote.addEventListener(
      "pointermove",
      handleMove
    )

    remote.addEventListener(
      "pointerleave",
      handleLeave
    )

    return () => {
      remote.removeEventListener(
        "pointermove",
        handleMove
      )

      remote.removeEventListener(
        "pointerleave",
        handleLeave
      )
    }
  }, [])

  const clearTransition = () => {
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current)
    transitionTimerRef.current = null
    setTransitioning(false)
    setSignalActive(false)
    setFlashActive(false)
  }
  const startChannelTransition = () => {
    clearTransition()
    setTransitionId((value) => value + 1)
    setTransitioning(true)
    setSignalActive(true)
    setFlashActive(true)
    transitionTimerRef.current = window.setTimeout(clearTransition, 300)
  }
  const stopVideo = () => {
    exclusiveVideoRef.current?.pause()
    youtubeRef.current?.pause()
  }
  const canControl = () => phaseRef.current === "on"
  const applyDestinationAudio = (screen: Screen, mode: Mode) => {
    stopVideo()
    if (destinationAllowsStation(screen, mode)) {
      if (stationMode && owner === "music") resume()
      else restoreStation(true)
    } else {
      // Restore metadata after exclusive media without ever starting the station.
      if (!stationMode) restoreStation(false)
      suspend(screen.startsWith("video-") || (screen === "broadcast" && mode === "video") ? "video" : "browsing")
    }
  }
  const returnBroadcast = (mode: Mode) => {
    stopVideo()
    clearTransition()
    setTvMode(mode)
    setTvChannel(tvRef.current.channel)
    dispatch({ type: "broadcast", mode })
    applyDestinationAudio("broadcast", mode)
  }
  const goHome = () => {
    if (!canControl()) return
    if (tvRef.current.artistContext.kind === "official") {
      returnBroadcast("music")
      return
    }
    const artist = artists.find((item) => item.slug === lastOfficialArtistSlug) ?? artists[0]
    const channel = artists.findIndex((item) => item.slug === artist.slug)
    stopVideo()
    clearTransition()
    tvRef.current = { ...tvRef.current, artistContext: { kind: "official", slug: artist.slug }, channel, mode: "music", screen: "broadcast", cursor: 0 }
    dispatch({ type: "channel", channel, slug: artist.slug, exitArchive: true })
    setTvArtistContext({ kind: "official", slug: artist.slug })
    setTvChannel(channel)
    setTvMode("music")
    startStation(artist.slug, artistPlaylist(artist, releases), undefined, false, true)
  }
  const openSection = (section: "MUSIC" | "VIDEOS") => {
    if (!canControl()) return
    if (section === "MUSIC") returnBroadcast("music")
    else {
      stopVideo()
      applyDestinationAudio("video-list", "video")
      setTvMode("video")
      dispatch({ type: "broadcast", mode: "video" })
      dispatch({ type: "screen", screen: "video-list" })
    }
  }
  const changeChannel = (direction: -1 | 1) => {
    if (!canControl() || tvRef.current.screen.startsWith("exclusive") || tvRef.current.screen === "archive-list") return
    stopVideo()
    const priorScreen = tvRef.current.screen
    const activeContext = tvRef.current.artistContext
    if (activeContext.kind === "archive") {
      const previousIndex = archiveArtists.findIndex((artist) => artist.id === activeContext.id)
      const nextIndex = (previousIndex + direction + archiveArtists.length) % archiveArtists.length
      const artist = archiveArtists[nextIndex]
      const nextScreen = priorScreen === "video-player" ? "video-list"
        : priorScreen === "options-tracks" ? "options-release-list" : priorScreen
      const tracks = artistPlaylist(artist, releases)
      dispatch({ type: "archive-channel", id: artist.id, index: nextIndex, screen: nextScreen })
      setTvArtistContext({ kind: "archive", id: artist.id })
      startStation(artist.id, tracks, undefined, true, destinationAllowsStation(nextScreen, tvRef.current.mode))
      if (!destinationAllowsStation(nextScreen, tvRef.current.mode)) applyDestinationAudio(nextScreen, tvRef.current.mode)
      startChannelTransition()
      return
    }
    const next = (tvRef.current.channel + direction + artists.length) % artists.length
    const artist = artists[next]
    const nextScreen = priorScreen === "video-player" ? "video-list" : priorScreen === "options-tracks" ? "options-release-list" : priorScreen
    tvRef.current = { ...tvRef.current, channel: next, artistContext: { kind: "official", slug: artist.slug }, screen: nextScreen }
    dispatch({ type: "channel", channel: next, slug: artist.slug, exitArchive: false })
    setTvChannel(next)
    setTvMode(tv.mode)
    setTvArtistContext({ kind: "official", slug: artist.slug })
    if (nextScreen !== priorScreen) dispatch({ type: "screen", screen: nextScreen })
    const allowsStation = destinationAllowsStation(nextScreen, tv.mode)
    startStation(artist.slug, artistPlaylist(artist, releases), undefined, true, allowsStation)
    if (!allowsStation) applyDestinationAudio(nextScreen, tv.mode)
    startChannelTransition()
  }
  const openSpecial = (screen: "archive-list" | "exclusive-artists") => {
    if (!canControl()) return
    stopVideo()
    clearTransition()
    if (tv.mode === "video") specialReturnVideoScreen.current = tv.screen === "video-player" ? "video-player" : "video-list"
    applyDestinationAudio(screen, tv.mode)
    if (screen === "archive-list") {
      const context = tv.artistContext
      const archiveIndex = context.kind === "archive" ? archiveArtists.findIndex((artist) => artist.id === context.id) : tv.archive
      dispatch({ type: "open-archive", index: Math.max(0, archiveIndex) })
    } else dispatch({ type: "screen", screen })
  }
  const navigateMenu = (direction: -1 | 1) => {
    if (!canControl()) return
    const count = tv.screen === "options-categories" ? 2
      : tv.screen === "options-release-list" ? optionsReleases.length
      : tv.screen === "options-tracks" ? optionsRelease?.tracklist.filter((track) => track.audioUrl.trim()).length ?? 0
      : tv.screen === "video-list" ? activeVideos.length
      : tv.screen === "archive-list" ? archiveArtists.length
      : tv.screen === "exclusive-artists" ? exclusiveArtistSlugs.length
      : tv.screen === "exclusive-list" ? exclusiveArtist.exclusives.length : 0
    dispatch({ type: "cursor", direction, count })
  }
  const goBack = () => {
    if (!canControl()) return
    if (tv.screen === "broadcast") {
      if (tv.artistContext.kind === "archive") openSpecial("archive-list")
      return
    }
    if (tv.screen === "archive-list") {
      if (tv.mode === "video") {
        applyDestinationAudio(specialReturnVideoScreen.current, "video")
        dispatch({ type: "broadcast", mode: "video" })
        dispatch({ type: "screen", screen: specialReturnVideoScreen.current })
      } else returnBroadcast("music")
      return
    }
    if (tv.screen === "options-categories") {
      returnBroadcast("music")
      return
    }
    if (tv.screen === "video-list") {
      returnBroadcast("music")
      return
    }
    if (tv.screen === "exclusive-artists") {
      if (tv.mode === "video") {
        applyDestinationAudio(specialReturnVideoScreen.current, "video"); dispatch({ type: "screen", screen: specialReturnVideoScreen.current })
      } else returnBroadcast("music")
      return
    }
    if (tv.screen === "video-player") stopVideo()
    if (tv.screen === "exclusive-item") {
      stopVideo()
      applyDestinationAudio("exclusive-list", tv.mode)
    }
    dispatch({ type: "back" })
  }
  const selectMenuItem = () => {
    if (!canControl()) return
    if (tv.screen === "video-player") { youtubeRef.current?.toggle(); return }
    if (tv.screen === "broadcast") {
      if (tv.mode === "music") resume()
    } else if (tv.screen === "options-categories") {
      dispatch({ type: "options-category", category: tv.cursor === 0 ? "singles" : "projects" })
    } else if (tv.screen === "options-release-list") {
      const release = optionsReleases[tv.cursor]
      if (release) dispatch({ type: "options-release", slug: release.slug })
    } else if (tv.screen === "options-tracks") {
      const track = optionsRelease?.tracklist.filter((item) => item.audioUrl.trim())[tv.cursor]
      if (!track) return
      const queue = artistPlaylist(activeArtist, releases)
      const index = queue.findIndex((item) => item.id === track.id)
      if (index >= 0 && stationMode && current?.artistSlug === activeArtistSlug) selectTrack(index)
      else if (index >= 0) startStation(activeArtistSlug, queue, track.id, false, true)
    } else if (tv.screen === "video-list") {
      if (activeVideos[tv.cursor]) dispatch({ type: "video-select", index: tv.cursor })
    } else if (tv.screen === "archive-list") {
      const selected = archiveArtists[tv.cursor]
      if (!selected) return
      setTvArtistContext({ kind: "archive", id: selected.id })
      setTvMode("music")
      startStation(selected.id, artistPlaylist(selected, releases), undefined, true, true)
      dispatch({ type: "select" })
    } else if (tv.screen === "exclusive-artists") dispatch({ type: "select" })
    else if (tv.screen === "exclusive-list") {
      const item = exclusiveArtist.exclusives[tv.cursor]
      if (!item) return
      if (item.kind === "audio") {
        playExclusive({ id: item.id, title: item.title, artist: exclusiveArtist.name, artistSlug: exclusiveArtist.slug, artwork: item.artwork ?? "", audioUrl: item.audioUrl })
      } else if (item.kind === "video") suspend("video")
      dispatch({ type: "select" })
    } else if (tv.screen === "exclusive-item") {
      if (exclusive?.kind === "audio") resume()
      if (exclusive?.kind === "video") exclusiveVideoRef.current?.resume()
    }
  }
  const skipTrack = (direction: -1 | 1) => {
    if (!canControl()) return
    if (tv.screen === "video-player") { youtubeRef.current?.seekBy(direction * 10); return }
    if (!destinationAllowsStation(tv.screen, tv.mode) || owner !== "music" || !stationMode) return
    if (direction < 0) previousTrack()
    else nextTrack()
  }
  const openOptions = () => {
    if (!canOpenMusicOptions(tv) || !canControl()) return
    if (!tv.screen.startsWith("options-")) applyDestinationAudio("options-categories", "music")
    setTvMode("music")
    dispatch({ type: "broadcast", mode: "music" })
    dispatch({ type: "screen", screen: "options-categories" })
  }
  const togglePower = () => {
    clearTransition()
    stopVideo()
    youtubeRef.current?.pause()
    if (powerTimerRef.current !== null) window.clearTimeout(powerTimerRef.current)
    if (phaseRef.current === "off" || phaseRef.current === "stopping") {
      phaseRef.current = "starting"
      setTvPoweredOn(true)
      setTvChannel(tv.channel)
      setTvMode("music")
      setPowerOn(true)
      setPowerPhase("starting")
      dispatch({ type: "broadcast", mode: "music" })
      startStation(activeArtistSlug, artistPlaylist(activeArtist, releases))
      powerTimerRef.current = window.setTimeout(() => {
        phaseRef.current = "on"
        setPowerPhase("on")
        powerTimerRef.current = null
      }, 280)
    } else {
      setTvPoweredOn(false)
      suspend("off")
      phaseRef.current = "stopping"
      setPowerPhase("stopping")
      powerTimerRef.current = window.setTimeout(() => {
        phaseRef.current = "off"
        setPowerOn(false)
        setPowerPhase("off")
        powerTimerRef.current = null
      }, 260)
    }
  }
  const remoteStyle = {
    "--rx": "0deg",
    "--ry": "0deg",
    "--tx": "0px",
    "--ty": "0px",
  } as CSSProperties

  const updateVolumeFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const bar = volumeBarRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const usableWidth = Math.max(1, rect.width - VOLUME_KNOB_SIZE)
    const next = Math.min(1, Math.max(0, (event.clientX - rect.left - VOLUME_KNOB_INSET) / usableWidth))
    setVolume(next)
    if (tv.screen === "video-player") youtubeRef.current?.setVolume(next)
  }

  return (
    <section
      className="relative isolate overflow-hidden bg-[#050604] px-4 py-24 text-[#d2c7b2] md:px-7 md:py-32"
      style={{
        minHeight: "920px",
      }}
    >

      {/* =================================================
          LOCAL ANIMATIONS
          ================================================= */}

      <style>
        {`
          @keyframes nhbAmbientFlicker {
            0%   { opacity: .82; transform: scale(1); }
            6%   { opacity: .76; }
            8%   { opacity: .92; }
            11%  { opacity: .80; }
            31%  { opacity: .86; }
            34%  { opacity: .78; }
            37%  { opacity: .88; }
            63%  { opacity: .84; }
            66%  { opacity: .73; }
            68%  { opacity: .91; }
            100% { opacity: .82; transform: scale(1.015); }
          }

          @keyframes nhbScreenFlicker {
            0%   { filter: brightness(1); }
            7%   { filter: brightness(.96); }
            8%   { filter: brightness(1.08); }
            9%   { filter: brightness(.99); }
            43%  { filter: brightness(1); }
            44%  { filter: brightness(.94); }
            45%  { filter: brightness(1.04); }
            100% { filter: brightness(1); }
          }

          @keyframes nhbRoomBreath {
            0%,100% {
              opacity: .62;
            }
            50% {
              opacity: .82;
            }
          }

          @keyframes nhbStaticMove {
            0%   { transform: translateY(0); }
            25%  { transform: translateY(-2px); }
            50%  { transform: translateY(1px); }
            75%  { transform: translateY(-1px); }
            100% { transform: translateY(0); }
          }

          @keyframes nhbCrtPowerOn {
            0% { transform: scale(.55, .012); filter: brightness(3); opacity: .85; }
            45% { transform: scale(1, .035); filter: brightness(2); opacity: 1; }
            100% { transform: scale(1, 1); filter: brightness(1); opacity: 1; }
          }

          @keyframes nhbCrtPowerOff {
            0% { transform: scale(1, 1); filter: brightness(1); opacity: 1; }
            65% { transform: scale(1, .025); filter: brightness(2); opacity: 1; }
            100% { transform: scale(.18, .008); filter: brightness(3); opacity: 0; }
          }

          .nhb-crt-power-on {
            transform-origin: center;
            animation: nhbCrtPowerOn .28s ease-out both;
          }

          .nhb-crt-power-off {
            transform-origin: center;
            animation: nhbCrtPowerOff .26s ease-in both;
          }

          .nhb-ambient-flicker {
            animation:
              nhbAmbientFlicker
              5.8s
              steps(1,end)
              infinite;
          }

          .nhb-screen-flicker {
            animation:
              nhbScreenFlicker
              4.8s
              steps(1,end)
              infinite;
          }

          .nhb-room-breath {
            animation:
              nhbRoomBreath
              6s
              ease-in-out
              infinite;
          }

          .nhb-static {
            animation:
              nhbStaticMove
              .25s
              steps(2,end)
              infinite;
          }
        `}
      </style>


      {/* =================================================
          DARK ROOM
          ================================================= */}

      <div
        className="pointer-events-none absolute inset-0 transition-all duration-700"
        style={{
          background: powerOn
            ? `
              radial-gradient(
                ellipse at 38% 53%,
                ${light.haze} 0%,
                rgba(20,25,18,.18) 27%,
                rgba(5,6,4,0) 58%
              ),
              radial-gradient(
                circle at 80% 18%,
                ${light.edge},
                transparent 28%
              ),
              linear-gradient(
                180deg,
                #090b07 0%,
                #050604 55%,
                #020302 100%
              )
            `
            : `
              linear-gradient(
                180deg,
                #040504 0%,
                #020302 100%
              )
            `,
        }}
      />


      {/* wall glow */}

      <div
        className={`pointer-events-none absolute left-[5%] top-[12%] h-[72%] w-[72%] rounded-[50%] blur-[90px] transition-opacity duration-500 ${
          powerOn
            ? "nhb-ambient-flicker"
            : "opacity-0"
        }`}
        style={{
          background:
            light.glow,
        }}
      />


      {/* larger room spill */}

      <div
        className={`pointer-events-none absolute left-[2%] top-[22%] h-[58%] w-[55%] rounded-[45%] blur-[150px] transition-opacity duration-700 ${
          powerOn
            ? "nhb-room-breath"
            : "opacity-0"
        }`}
        style={{
          background:
            light.haze,
        }}
      />


      {/* floor light */}

      <div
        className={`pointer-events-none absolute bottom-[7%] left-[7%] h-[110px] w-[68%] rounded-[50%] blur-[50px] transition-opacity duration-500 ${
          powerOn
            ? "opacity-60"
            : "opacity-0"
        }`}
        style={{
          background:
            light.glow,
        }}
      />


      {/* dark vignette */}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,.32)_61%,rgba(0,0,0,.84)_100%)]" />


      {/* faint furniture / room shadows */}

      <div className="pointer-events-none absolute bottom-0 left-0 h-[27%] w-full bg-gradient-to-t from-black via-black/55 to-transparent" />

      <div className="pointer-events-none absolute bottom-[8%] left-[4%] h-[16%] w-[48%] rounded-t-[35%] bg-black/25 blur-xl" />

      <div className="pointer-events-none absolute right-[2%] top-[18%] h-[56%] w-[9%] bg-black/25 blur-2xl" />


      {/* =================================================
          HEADER
          ================================================= */}

      <div className="relative z-10 mx-auto mb-14 flex max-w-7xl items-end justify-between">

        <div>

          <p className="font-mono text-[8px] uppercase tracking-[0.26em] text-[#b2aa96]/35">
            NO.HOLDS BARRED / NIGHT TRANSMISSION
          </p>

          <h2 className="mt-3 font-display text-[11vw] leading-[0.73] tracking-[-0.06em] text-[#a9a28f] md:text-[6.5vw]">
            Watch.
          </h2>

        </div>


        <div className="hidden items-center gap-3 md:flex">

          <span
            className={`h-2 w-2 rounded-full ${
              powerOn
                ? "bg-[#99b494] shadow-[0_0_12px_rgba(160,195,153,.75)]"
                : "bg-[#39211d]"
            }`}
          />

          <span className="font-mono text-[7px] uppercase tracking-[0.22em] text-[#aaa28e]/32">
            {powerOn
              ? "signal detected"
              : "no signal"}
          </span>

        </div>

      </div>


      {/* =================================================
          TV + REMOTE
          ================================================= */}

      <div className="relative z-10 mx-auto max-w-7xl">

        <div className="grid items-end gap-20 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-28">


          {/* =================================================
              TV
              ================================================= */}

          <div className="relative min-w-0">


            {/* giant TV backlight */}

            <div
              className={`pointer-events-none absolute -inset-[12%] rounded-[30%] blur-[85px] transition-opacity duration-500 ${
                powerOn
                  ? "nhb-ambient-flicker"
                  : "opacity-0"
              }`}
              style={{
                background:
                  light.glow,
              }}
            />

            <div
              className={`pointer-events-none absolute -inset-[16%] rounded-[35%] blur-[100px] transition-opacity duration-200 ${
                flashActive && powerOn ? "opacity-[0.45]" : "opacity-0"
              }`}
              style={{ background: light.glow }}
            />


            {/* TV floor shadow */}

            <div className="absolute -bottom-11 left-[5%] right-[5%] h-16 rounded-full bg-black/80 blur-2xl" />


            {/* The shell image supplies the physical casing, speaker, controls, and feet. */}
            <div className="relative aspect-[1369/1149] w-full drop-shadow-[0_30px_50px_rgba(0,0,0,0.85)]">

                    <div
                      className={`absolute left-[14.3%] top-[13.4%] z-10 h-[64%] w-[71.4%] overflow-hidden rounded-[2%] bg-black shadow-[inset_0_0_70px_rgba(0,0,0,1)] ${
                        powerOn
                          ? "nhb-screen-flicker"
                          : ""
                      }`}
                    >


                      {/* POWER OFF */}

                      {/* POWER ON */}

                      <div
                        className={`pointer-events-none absolute inset-0 bg-black text-[#ded3bc] ${!powerOn ? "invisible" : ""} ${
                          powerPhase === "starting" ? "nhb-crt-power-on" : powerPhase === "stopping" ? "nhb-crt-power-off" : ""
                        }`}
                      >
                        {tv.mode === "music" && !["video-list", "video-player"].includes(tv.screen) && (
                          musicTrack ? <>
                            {musicTrack.artwork && <Image src={musicTrack.artwork} alt={`${musicTrack.releaseTitle ?? musicTrack.title} artwork`} fill sizes="(max-width: 1024px) 75vw, 600px" className="object-cover" />}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-4 pt-8 text-center font-mono text-[9px] tracking-[0.1em]">
                              <p>{musicTrack.title}</p>
                              {mediaError ? <p className="mt-2">AUDIO UNAVAILABLE</p> : needsGesture ? <p className="mt-2">PRESS OK TO PLAY</p> : null}
                            </div>
                          </> : <div className="absolute inset-0 grid place-items-center font-mono text-sm tracking-widest">NO MUSIC YET</div>
                        )}
                        {tv.screen === "video-player" && video && <YouTubePlayer ref={youtubeRef} title={video.title} url={video.youtubeUrl} volume={volume} />}
                        {tv.screen !== "broadcast" && tv.screen !== "video-player" && (
                          <div className="absolute inset-0 overflow-y-auto bg-[#11100b] p-5 text-[#d4c49d] md:p-8">
                            <p className="border-b border-[#cbb67f]/20 pb-3 font-mono text-[10px] uppercase tracking-[0.2em]">
                              {tv.screen.startsWith("options") ? (tv.screen === "options-categories" ? `${identity} / MUSIC OPTIONS` : tv.screen === "options-release-list" ? tv.optionsCategory.toUpperCase() : optionsRelease?.title ?? "PROJECT TRACKS") : tv.screen.startsWith("video") ? `${identity} / VIDEOS` : tv.screen === "archive-list" ? "ARCHIVE" : tv.screen === "exclusive-artists" ? "EXCLUSIVE" : `${exclusiveArtist.name} / EXCLUSIVE`}
                            </p>
                            {tv.screen === "options-categories" && <div className="mt-6 font-mono text-sm tracking-widest">
                              {["SINGLES", "PROJECTS"].map((label, index) => <div key={label} className={`border-b border-[#d2ba81]/15 py-3 ${tv.cursor === index ? "text-[#f2dfb5]" : "text-[#c0ae85]/60"}`}>{tv.cursor === index ? "> " : ""}{label}</div>)}
                            </div>}
                            {tv.screen === "options-release-list" && <div className="mt-6 font-mono text-sm tracking-widest">
                              {optionsReleases.length ? optionsReleases.map((release, index) => <div key={release.slug} className={`border-b border-[#d2ba81]/15 py-3 ${tv.cursor === index ? "text-[#f2dfb5]" : "text-[#c0ae85]/60"}`}>{tv.cursor === index ? "> " : ""}{release.title}</div>) : <p className="mt-8 text-center">NO {tv.optionsCategory === "singles" ? "SINGLES" : "PROJECTS"} YET</p>}
                            </div>}
                            {tv.screen === "options-tracks" && <div className="mt-6 font-mono text-sm tracking-widest">
                              {optionsRelease?.tracklist.filter((track) => track.audioUrl.trim()).map((track, index) => <div key={track.id} className={`border-b border-[#d2ba81]/15 py-3 ${tv.cursor === index ? "text-[#f2dfb5]" : "text-[#c0ae85]/60"}`}>{tv.cursor === index ? "> " : ""}{track.title}</div>)}
                            </div>}
                            {tv.screen === "video-list" && <div className="mt-6 font-mono text-sm tracking-widest">
                              {activeVideos.length ? activeVideos.map((item, index) => <div key={item.id} className={`border-b border-[#d2ba81]/15 py-3 ${tv.cursor === index ? "text-[#f2dfb5]" : "text-[#c0ae85]/60"}`}>{tv.cursor === index ? "> " : ""}{item.title}</div>) : <p className="mt-8 text-center">NO VIDEOS YET</p>}
                            </div>}
                            {tv.screen === "archive-list" && <div className="mt-4">
                              {archiveArtists.map((entry, index) => <div key={entry.id} className={`border-b border-[#d2ba81]/15 py-2 font-display text-lg uppercase md:text-2xl ${tv.cursor === index ? "text-[#f2dfb5]" : "text-[#c0ae85]/60"}`}>
                                {tv.cursor === index ? "> " : ""}{entry.name}
                              </div>)}
                            </div>}
                            {tv.screen === "exclusive-artists" && <div className="mt-6 font-mono text-sm tracking-widest">
                              {exclusiveArtistSlugs.map((slug, index) => <div key={slug} className={`border-b border-[#d2ba81]/15 py-3 ${tv.cursor === index ? "text-[#f2dfb5]" : "text-[#c0ae85]/60"}`}>
                                {tv.cursor === index ? "> " : ""}{artists.find((artist) => artist.slug === slug)!.name}
                              </div>)}
                            </div>}
                            {tv.screen === "exclusive-list" && <div className="mt-6 font-mono text-sm tracking-widest">
                              {exclusiveArtist.exclusives.length ? exclusiveArtist.exclusives.map((item, index) => <div key={item.id} className={`border-b border-[#d2ba81]/15 py-3 ${tv.cursor === index ? "text-[#f2dfb5]" : "text-[#c0ae85]/60"}`}>
                                {tv.cursor === index ? "> " : ""}{item.title}
                              </div>) : <p className="mt-8 text-center">NO EXCLUSIVES YET</p>}
                            </div>}
                            {tv.screen === "exclusive-item" && exclusive && <div className="absolute inset-x-5 bottom-5 top-16 md:inset-x-8">
                              {exclusive.kind === "image" && <Image src={exclusive.imageUrl} alt={exclusive.alt} fill sizes="600px" className="object-contain" />}
                              {exclusive.kind === "audio" && <>
                                {exclusive.artwork && <Image src={exclusive.artwork} alt="" fill sizes="600px" className="object-contain" />}
                                <p className="absolute inset-x-0 bottom-0 bg-black/70 p-3 text-center font-mono text-xs">{exclusive.title}{mediaError ? " / AUDIO UNAVAILABLE" : needsGesture ? " / PRESS OK TO PLAY" : ""}</p>
                              </>}
                              {exclusive.kind === "video" && <BroadcastVideo key={exclusive.id} ref={exclusiveVideoRef} video={{ id: exclusive.id, title: exclusive.title, source: exclusive.source, thumbnail: exclusive.poster }} active={powerPhase === "on"} volume={volume} />}
                            </div>}
                          </div>
                        )}
                        {tv.screen === "broadcast" && tv.mode === "music" && <div className="absolute left-4 top-4 max-w-[68%] bg-black/40 px-2 py-1 font-mono text-[8px] uppercase leading-[1.45] tracking-[0.12em] text-white/65">
                          <p>{tv.artistContext.kind === "archive" ? `ARCHIVE / ${identity}` : `${channelLabel} / ${identity}`}</p>
                          <p className="mt-1 max-w-[34ch] text-[7px] tracking-[0.1em]">SHUFFLED PLAYLIST, PRESS OPTIONS TO SELECT SPECIFIC SONGS</p>
                        </div>}
                        {tv.screen === "broadcast" && tv.mode === "video" && <p className="absolute left-4 top-4 bg-black/40 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.15em] text-white/65">{tv.artistContext.kind === "archive" ? `ARCHIVE / ${identity}` : `${channelLabel} / ${identity}`}</p>}
                        {transitioning && <img key={transitionId} src={`/images/channel-switch.gif?switch=${transitionId}`} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                      </div>                      {/* curved CRT shadow */}

                      <div className="pointer-events-none absolute inset-0 rounded-[11%] bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,.5)_100%)]" />


                      {/* scanlines */}

                      <div className={`pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,.1)_0px,rgba(255,255,255,.1)_1px,transparent_1px,transparent_4px)] ${powerOn ? "opacity-[0.15]" : "opacity-0"}`} />


                      {/* screen reflection */}

                      <div className={`pointer-events-none absolute left-[7%] top-[4%] h-[27%] w-[53%] rotate-[-8deg] rounded-[50%] bg-white/[0.05] blur-xl ${powerOn ? "" : "opacity-0"}`} />


                      {/* static texture */}

                      <div className={`nhb-static pointer-events-none absolute inset-0 bg-[repeating-radial-gradient(circle_at_center,#fff_0px,transparent_1px,transparent_3px)] ${powerOn ? "opacity-[0.035]" : "opacity-0"}`} />


                    </div>

              <Image
                src="/images/tv-shell.png"
                alt=""
                width={1369}
                height={1149}
                priority
                className="pointer-events-none absolute inset-0 z-20 h-full w-full select-none object-contain"
              />
              <button
                type="button"
                onClick={togglePower}
                aria-label="TV power"
                className="absolute left-[70.2%] top-[86.7%] z-30 h-[6.2%] w-[5.4%] cursor-pointer rounded-full bg-transparent"
              />
            </div>

          </div>


          {/* =================================================
              REMOTE
              ================================================= */}

          <div className="flex justify-center lg:justify-end">

            <div
              ref={remoteRef}
              style={remoteStyle}
              className="relative w-[280px] md:w-[300px]"
            >

              <div
                className="relative transition-transform duration-200 ease-out"
                style={{
                  transform:
                    "perspective(900px) translate3d(var(--tx), var(--ty), 0) rotateX(var(--rx)) rotateY(var(--ry)) rotateZ(-4deg)",
                }}
              >

                {/* shadow */}

                <div className="absolute -bottom-8 left-[10%] right-[10%] h-10 rounded-full bg-black/70 blur-xl" />


                {/* body */}

                <div className="broadcast-remote relative rounded-[34px] border-2 border-[#080808] bg-[#1b1b1a] px-5 pb-6 pt-5 shadow-[0_28px_55px_rgba(0,0,0,.72)]">

                  <div className="broadcast-remote-face pointer-events-none absolute inset-[6px] rounded-[29px] border border-white/[0.07]" />


                  {/* signal LED */}

                  <div
                    className={`absolute right-6 top-5 h-2.5 w-2.5 rounded-full transition-all duration-100 ${
                      signalActive
                        ? "scale-125 bg-red-500 shadow-[0_0_14px_rgba(255,30,20,.9)]"
                        : "bg-[#5c1715]"
                    }`}
                  />


                  {/* brand */}

                  <div className="mb-4 flex items-end justify-between px-2">

                    <div>

                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                        no.holds
                      </p>

                      <p className="mt-1 font-mono text-[6px] uppercase tracking-[0.18em] text-white/28">
                        broadcast
                        controller
                      </p>

                    </div>

                    <span className="pr-5 font-mono text-[6px] text-white/20">
                      NHB-01
                    </span>

                  </div>


                  {/* display */}

                  <div className="broadcast-remote-display rounded-[10px] border border-black bg-[#070707] p-2 shadow-[inset_0_3px_8px_rgba(0,0,0,.9)]">

                    <div className="rounded-[4px] border border-white/10 bg-[#101010] px-3 py-3">

                      <div className="flex justify-between font-mono text-[7px] uppercase tracking-[0.15em] text-white/25">

                        <span>
                          CHANNEL
                        </span>

                        <span>
                          SELECT
                        </span>

                      </div>


                      <div className="mt-2 flex items-end justify-between">

                        <span className="font-mono text-[32px] leading-none text-white/80">
                          {String(selectedChannel + 1).padStart(2, "0")}
                        </span>

                        <span className="font-mono text-[11px] uppercase text-white/50">
                          {tv.screen.startsWith("archive") ? "ARCHIVE" : tv.screen.startsWith("exclusive") ? "EXCLUSIVE" : identity}
                        </span>

                      </div>

                    </div>

                  </div>


                  {/* home / power */}

                  <div className="mt-4 grid grid-cols-2 gap-2">

                    <button
                      type="button"
                      onClick={goHome}
                      className="remote-black-button text-[15px] font-bold uppercase text-[#e2d8c2]"
                    >
                      HOME
                    </button>


                    <button
                      type="button"
                      onClick={togglePower}
                      className="remote-black-button remote-power-button text-[15px] font-bold uppercase text-[#e2d8c2]"
                    >
                      POWER
                    </button>

                  </div>


                  {/* channel */}

                  <div className="broadcast-remote-channel-well mt-4 rounded-[13px] border border-white/[0.07] bg-[#242424] p-3">

                    <p className="mb-2 text-center font-mono text-[7px] uppercase tracking-[0.2em] text-white/27">
                      CHANNEL
                    </p>

                    <div className="grid grid-cols-2 gap-2">

                      <button
                        type="button"
                        onClick={() => changeChannel(1)}
                        aria-label="Channel up"
                        className="remote-direction-button"
                      >
                        ▲
                      </button>


                      <button
                        type="button"
                        onClick={() => changeChannel(-1)}
                        aria-label="Channel down"
                        className="remote-direction-button"
                      >
                        ▼
                      </button>

                    </div>

                  </div>


                  {/* dpad */}
                  <div className="mt-4 flex justify-center">
                    <div className="broadcast-remote-dpad relative h-[115px] w-[115px] rounded-full border-2 border-black bg-[#101010] shadow-[inset_0_5px_10px_rgba(0,0,0,.85)]">
                      <button type="button" aria-label="Menu up" onClick={() => navigateMenu(-1)} className="absolute left-1/2 top-3 -translate-x-1/2 font-mono text-[13px] text-white/45 hover:text-white">▲</button>
                      <button type="button" aria-label="Menu down" onClick={() => navigateMenu(1)} className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[13px] text-white/45 hover:text-white">▼</button>
                      <button type="button" aria-label="Previous track" onClick={() => skipTrack(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-white/45 hover:text-white">&#9664;</button>
                      <button type="button" aria-label="Next track" onClick={() => skipTrack(1)} className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-white/45 hover:text-white">&#9654;</button>
                      <button type="button" onClick={selectMenuItem} className="broadcast-remote-ok absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black bg-[#282828]">
                        <span className="font-mono text-[9px] font-bold tracking-[0.15em] text-white/55">OK</span>
                      </button>
                    </div>
                  </div>
                  {/* destinations */}
                  <div className="broadcast-remote-custom mt-4">
                    <p className="mb-2 font-mono text-[13px] uppercase tracking-[0.08em] text-white/55">Destination</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" onClick={() => openSection("MUSIC")} className={`remote-destination-button ${isRemoteDestinationActive("music", tv) ? "remote-destination-active" : ""}`}>MUSIC</button>
                      <button type="button" onClick={() => openSection("VIDEOS")} className={`remote-destination-button ${isRemoteDestinationActive("videos", tv) ? "remote-destination-active" : ""}`}>VIDEOS</button>
                      <div className="flex flex-col gap-2">
                        <button type="button" onClick={openOptions} className={`remote-destination-button rounded-full py-1 text-[9px] ${isRemoteDestinationActive("options", tv) ? "remote-destination-active" : ""}`}>OPTIONS</button>
                        <button type="button" onClick={goBack} className="remote-destination-button py-1">BACK</button>
                        <button type="button" onClick={() => openSpecial("archive-list")} className={`remote-destination-button ${isRemoteDestinationActive("archive", tv) ? "remote-destination-active" : ""}`}>ARCHIVE</button>
                      </div>
                    </div>
                  </div>
                  <div className="broadcast-remote-custom mt-2">
                    <button type="button" onClick={() => openSpecial("exclusive-artists")} className={`remote-destination-button w-full ${isRemoteDestinationActive("exclusive", tv) ? "remote-destination-active" : ""}`}>EXCLUSIVE</button>
                  </div>
                  <div className="broadcast-remote-volume mt-5 border-t border-white/[0.07] pt-4">
                    <div className="mb-3 flex items-center justify-between font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">
                      <span>Volume</span>
                      <span className="text-[12px] text-[#c5a565]/80">{Math.round(volume * 100).toString().padStart(3, "0")}%</span>
                    </div>
                    <div
                      ref={volumeBarRef}
                      role="slider"
                      aria-label="Remote volume"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(volume * 100)}
                      tabIndex={0}
                      onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId)
                        updateVolumeFromPointer(event)
                      }}
                      onPointerMove={(event) => {
                        if (event.currentTarget.hasPointerCapture(event.pointerId)) updateVolumeFromPointer(event)
                      }}
                      onPointerUp={(event) => {
                        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
                      }}
                      onPointerCancel={(event) => {
                        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowRight") setVolume(Math.min(1, volume + 0.05))
                        if (event.key === "ArrowLeft") setVolume(Math.max(0, volume - 0.05))
                      }}
                      className="cursor-ew-resize touch-none rounded-full border border-[#090909] bg-[#292a28] shadow-[inset_0_3px_7px_rgba(0,0,0,.9),inset_0_1px_0_rgba(255,255,255,.14),inset_0_-2px_0_rgba(0,0,0,.65)]"
                      style={{
                        position: "relative",
                        width: "100%",
                        height: 46,
                        borderRadius: 9999,
                        background: "linear-gradient(180deg, #3b3c39 0%, #272825 42%, #1a1b19 100%)",
                        boxShadow: "inset 0 3px 7px rgba(0,0,0,.9), inset 0 1px 0 rgba(255,255,255,.14), inset 0 -2px 0 rgba(0,0,0,.65), 0 1px 0 rgba(255,255,255,.05)",
                      }}
                    >
                      <div
                        className="pointer-events-none rounded-full border-2 border-[#111210] bg-[#080908] shadow-[inset_0_3px_6px_rgba(0,0,0,.98),inset_0_1px_0_rgba(255,255,255,.12),0_1px_0_rgba(255,255,255,.08)]"
                        style={{
                          position: "absolute",
                          left: 22,
                          right: 22,
                          top: "50%",
                          height: 20,
                          transform: "translateY(-50%)",
                          borderRadius: 9999,
                          background: "linear-gradient(180deg, #161816 0%, #050605 58%, #0e100e 100%)",
                          boxShadow: "inset 0 3px 6px rgba(0,0,0,.98), inset 0 1px 0 rgba(255,255,255,.12), 0 1px 0 rgba(255,255,255,.08)",
                        }}
                      />
                      <div
                        className="pointer-events-none z-20"
                        style={{
                          position: "absolute",
                          left: 22,
                          right: 22,
                          top: 0,
                          bottom: 0,
                          zIndex: 30,
                        }}
                      >
                        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#171816] bg-[#5b5c57] shadow-[inset_0_3px_4px_rgba(255,255,255,.24),inset_0_-6px_8px_rgba(0,0,0,.82),0_3px_7px_rgba(0,0,0,.9)]" style={{ left: `${volume * 100}%`, width: 44, height: 44, zIndex: 30, background: "linear-gradient(145deg, #73756f 0%, #4c4e49 38%, #262824 100%)" }}>
                          <span className="absolute inset-[6px] rounded-full border border-black/80 bg-[#242622] shadow-[inset_0_3px_4px_rgba(0,0,0,.95),inset_0_1px_0_rgba(255,255,255,.15),0_1px_0_rgba(255,255,255,.06)]">
                            <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#a68b4d]/90 shadow-[0_0_3px_rgba(166,139,77,.35)]" />
                            <span className="absolute left-[22%] top-[18%] h-[3px] w-[7px] rotate-[-28deg] rounded-full bg-white/20 blur-[1px]" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* status */}
      <div className="relative z-10 mx-auto mt-20 flex max-w-7xl justify-between border-t border-[#a7a08c]/10 pt-5 font-mono text-[8px] uppercase tracking-[0.2em] text-[#a7a08c]/30">
        <span>
          {tv.screen.startsWith("archive") ? "ARCHIVE" : tv.screen.startsWith("exclusive") ? `${channelLabel} / ${identity} / EXCLUSIVE` : `${tv.artistContext.kind === "archive" ? `ARCHIVE / ${identity}` : `${channelLabel} / ${identity}`} / ${tv.mode.toUpperCase()}`}
        </span>
        <span>{powerOn ? "signal detected" : "transmission ended"}</span>
      </div>
    </section>
  )
}
