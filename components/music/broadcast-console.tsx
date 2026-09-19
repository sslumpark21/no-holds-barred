"use client"

import Image from "next/image"
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react"

import { artists, releases } from "@/lib/data"
import { useAudio } from "@/components/audio/audio-provider"

const lightByChannel = [
  { glow: "rgba(159, 192, 151, 0.32)", edge: "rgba(202, 176, 98, 0.11)", haze: "rgba(128, 151, 103, 0.12)" },
  { glow: "rgba(123, 170, 157, 0.34)", edge: "rgba(62, 87, 119, 0.13)", haze: "rgba(66, 102, 94, 0.13)" },
  { glow: "rgba(203, 181, 111, 0.28)", edge: "rgba(140, 92, 50, 0.12)", haze: "rgba(161, 133, 77, 0.12)" },
]

type View =
  | "HOME"
  | "CHANNEL_MENU"
  | "SONGS_MENU"
  | "ALBUMS_EPS"
  | "SINGLES"
  | "EXCLUSIVE_PREVIEW"
  | "VIDEOS_MENU"
  | "VIDEO_PLAYER"
  | "AFFILIATE_INTRO"
  | "AFFILIATE_DIRECTORY"

type SignalSource = "member" | "affiliate"
type PowerPhase = "on" | "starting" | "stopping" | "off"

const affiliateDirectory = [
  { id: "andreas-shinso", name: "Andreas Shinso" },
  { id: "cyupercah", name: "Cyupercah" },
  { id: "moise6969", name: "moise6969" },
  { id: "2007", name: "2007" },
]

type ChannelMedia = {
  albumsEps: string[]
  singles: string[]
  exclusivePreview: string[]
  videos: { title: string; url: string }[]
}

type CurrentChannel = {
  kind: SignalSource
  id: string
  name: string
  label: string
  media: ChannelMedia
}

const emptyMedia: ChannelMedia = {
  albumsEps: [],
  singles: [],
  exclusivePreview: [],
  videos: [],
}

const affiliateMedia: Record<string, ChannelMedia> = {}

const VOLUME_KNOB_SIZE = 44
const VOLUME_KNOB_INSET = VOLUME_KNOB_SIZE / 2

export function BroadcastConsole() {
  const { volume, setVolume } = useAudio()
  const [powerOn, setPowerOn] = useState(true)
  const [powerPhase, setPowerPhase] = useState<PowerPhase>("on")
  const [view, setView] = useState<View>("HOME")
  const [selectedChannel, setSelectedChannel] = useState(0)
  const [affiliateIndex, setAffiliateIndex] = useState<number | null>(null)
  const [menuIndex, setMenuIndex] = useState(0)
  const [signalSource, setSignalSource] = useState<SignalSource>("member")
  const [transitioning, setTransitioning] = useState(false)
  const [transitionId, setTransitionId] = useState(0)
  const [signalActive, setSignalActive] = useState(false)
  const [flashActive, setFlashActive] = useState(false)
  const remoteRef = useRef<HTMLDivElement | null>(null)
  const channelRef = useRef(0)
  const transitionTimerRef = useRef<number | null>(null)
  const powerTimerRef = useRef<number | null>(null)
  const volumeBarRef = useRef<HTMLDivElement | null>(null)

  const member = artists[selectedChannel]
  const light = lightByChannel[selectedChannel]
  const affiliate = affiliateIndex === null ? null : affiliateDirectory[affiliateIndex]
  const officialMedia: ChannelMedia = {
    albumsEps: member.releaseSlugs.map((slug) => releases.find((release) => release.slug === slug)).filter((release) => release?.type === "Album" || release?.type === "EP").map((release) => release!.title),
    singles: member.releaseSlugs.map((slug) => releases.find((release) => release.slug === slug)).filter((release) => release?.type === "Single").map((release) => release!.title),
    exclusivePreview: member.unreleased.map((track) => track.title),
    videos: member.videos.map((video) => ({ title: video.title, url: video.id })),
  }
  const currentChannel: CurrentChannel = signalSource === "affiliate" && affiliate
    ? { kind: "affiliate", id: affiliate.id, name: affiliate.name, label: `EX ${String((affiliateIndex ?? 0) + 1).padStart(2, "0")}`, media: affiliateMedia[affiliate.id] ?? emptyMedia }
    : { kind: "member", id: member.slug, name: member.name, label: `CH ${String(selectedChannel + 1).padStart(2, "0")}`, media: officialMedia }
  const identity = currentChannel.name
  const channelLabel = currentChannel.label

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current)
      }
      if (powerTimerRef.current !== null) {
        window.clearTimeout(powerTimerRef.current)
      }
    }
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

  const triggerSignal = (
    callback: () => void
  ) => {
    setSignalActive(true)
    setFlashActive(true)

    window.setTimeout(() => {
      callback()
    }, 80)

    window.setTimeout(() => {
      setSignalActive(false)
    }, 180)

    window.setTimeout(() => {
      setFlashActive(false)
    }, 260)
  }

  const clearTransition = () => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }
    setTransitioning(false)
  }

  const startChannelTransition = () => {
    clearTransition()
    setTransitionId((current) => current + 1)
    setTransitioning(true)
    triggerSignal(() => {})
    transitionTimerRef.current = window.setTimeout(() => {
      setTransitioning(false)
      transitionTimerRef.current = null
    }, 300)
  }

  const clearPowerTimer = () => {
    if (powerTimerRef.current !== null) {
      window.clearTimeout(powerTimerRef.current)
      powerTimerRef.current = null
    }
  }

  const startPower = () => {
    clearPowerTimer()
    clearTransition()
    setView("HOME")
    setMenuIndex(0)
    setPowerOn(true)
    setPowerPhase("starting")
    powerTimerRef.current = window.setTimeout(() => {
      setPowerPhase("on")
      powerTimerRef.current = null
    }, 280)
  }

  const goHome = () => {
    clearTransition()
    if (powerPhase === "off" || powerPhase === "stopping") {
      startPower()
      return
    }
    setView("HOME")
    setMenuIndex(0)
  }

  const play = () => {
    clearTransition()
    channelRef.current = 0
    setSelectedChannel(0)
    setSignalSource("member")
    setMenuIndex(0)
    setView("CHANNEL_MENU")
  }

  const changeChannel = (direction: -1 | 1) => {
    if (
      !powerOn ||
      powerPhase !== "on" ||
      view === "HOME" ||
      view === "AFFILIATE_INTRO" ||
      view === "AFFILIATE_DIRECTORY"
    ) return

    const inAffiliateSystem = signalSource === "affiliate"

    if (inAffiliateSystem) {
      setAffiliateIndex((current) =>
        ((current ?? 0) + direction + affiliateDirectory.length) %
        affiliateDirectory.length
      )
      setMenuIndex(0)
      setView("CHANNEL_MENU")
      startChannelTransition()
      return
    }

    const next =
      (channelRef.current + direction + artists.length) % artists.length
    channelRef.current = next
    setSelectedChannel(next)
    setSignalSource("member")
    setMenuIndex(0)
    setView("CHANNEL_MENU")

    startChannelTransition()
  }

  const navigateMenu = (direction: -1 | 1) => {
    if (powerPhase !== "on" || transitioning) return
    if (view === "AFFILIATE_DIRECTORY") {
      setMenuIndex((current) =>
        (current + direction + affiliateDirectory.length) %
        affiliateDirectory.length
      )
      return
    }
    const count = view === "CHANNEL_MENU" ? 2 : view === "SONGS_MENU" ? 3 : view === "VIDEOS_MENU" ? currentChannel.media.videos.length : 0
    if (count > 0) setMenuIndex((current) => (current + direction + count) % count)
  }

  const goBack = () => {
    if (powerPhase !== "on" || transitioning) return
    if (view === "CHANNEL_MENU") {
      if (signalSource === "affiliate" && affiliateIndex !== null) {
        setMenuIndex(affiliateIndex)
        setView("AFFILIATE_DIRECTORY")
      }
      return
    }
    if (view === "SONGS_MENU" || view === "VIDEOS_MENU") {
      setView("CHANNEL_MENU")
      setMenuIndex(0)
    } else if (view === "ALBUMS_EPS" || view === "SINGLES" || view === "EXCLUSIVE_PREVIEW") {
      setView("SONGS_MENU")
      setMenuIndex(0)
    } else if (view === "VIDEO_PLAYER") {
      setView("VIDEOS_MENU")
      setMenuIndex(0)
    }
  }

  const selectMenuItem = () => {
    if (powerPhase !== "on" || transitioning) return
    if (view === "HOME") {
      play()
    } else if (view === "AFFILIATE_INTRO") {
      setMenuIndex(0)
      setView("AFFILIATE_DIRECTORY")
    } else if (view === "AFFILIATE_DIRECTORY") {
      setAffiliateIndex(menuIndex)
      setSignalSource("affiliate")
      setMenuIndex(0)
      setView("CHANNEL_MENU")
    } else if (view === "CHANNEL_MENU") {
      setMenuIndex(0)
      setView(menuIndex === 0 ? "SONGS_MENU" : "VIDEOS_MENU")
    } else if (view === "SONGS_MENU") {
      const songsViews: View[] = ["ALBUMS_EPS", "SINGLES", "EXCLUSIVE_PREVIEW"]
      setView(songsViews[menuIndex])
      setMenuIndex(0)
    } else if (view === "VIDEOS_MENU" && currentChannel.media.videos.length > 0) {
      setView("VIDEO_PLAYER")
    }
  }

  const openSection = (section: "MUSIC" | "VIDEOS") => {
    if (
      powerPhase !== "on" ||
      transitioning ||
      view === "HOME" ||
      view === "AFFILIATE_INTRO" ||
      view === "AFFILIATE_DIRECTORY"
    ) return
    setMenuIndex(0)
    setView(section === "MUSIC" ? "SONGS_MENU" : "VIDEOS_MENU")
  }

  const openAffiliateIntro = () => {
    if (powerPhase !== "on" || transitioning) return
    clearTransition()
    setView("AFFILIATE_INTRO")
  }

  const togglePower = () => {
    clearTransition()
    if (powerPhase === "off" || powerPhase === "stopping") {
      startPower()
      return
    }
    clearPowerTimer()
    setPowerPhase("stopping")
    powerTimerRef.current = window.setTimeout(() => {
      setPowerOn(false)
      setPowerPhase("off")
      powerTimerRef.current = null
    }, 260)
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

                      {powerOn && (
                        <div
                          className={`pointer-events-none absolute inset-0 ${
                            powerPhase === "starting"
                              ? "nhb-crt-power-on"
                              : powerPhase === "stopping"
                                ? "nhb-crt-power-off"
                                : ""
                          }`}
                        >
                          {transitioning ? (
                            <img
                              key={transitionId}
                              src={`/images/channel-switch.gif?switch=${transitionId}`}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          ) : view === "HOME" ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black">
                              <p
                                className="font-mono text-3xl font-black tracking-[0.16em] text-[#d94337] md:text-5xl"
                                style={{
                                  textShadow:
                                    "0 0 3px rgba(255,80,65,.95), 0 0 16px rgba(217,48,38,.85), 0 0 38px rgba(170,25,20,.65)",
                                }}
                              >
                                Press OK
                              </p>
                            </div>
                          ) : view === "AFFILIATE_INTRO" ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black text-center">
                              <p
                                className="font-mono text-3xl font-black tracking-[0.16em] text-[#d94337] md:text-5xl"
                                style={{
                                  textShadow:
                                    "0 0 3px rgba(255,80,65,.95), 0 0 16px rgba(217,48,38,.85), 0 0 38px rgba(170,25,20,.65)",
                                }}
                              >
                                CURATED ARTISTS
                              </p>
                              <p className="font-mono text-xs tracking-[0.16em] text-[#d94337] md:text-sm">
                                WE FW THESE JOINTS
                              </p>
                              <p className="font-mono text-sm tracking-[0.16em] text-[#d94337] [text-shadow:0_0_12px_rgba(217,48,38,.7)] md:text-lg">
                                Press OK
                              </p>
                            </div>
                          ) : view === "AFFILIATE_DIRECTORY" ? (
                            <div className="absolute inset-0 overflow-y-auto bg-[#11100b] p-5 text-[#d4c49d] md:p-8">
                              <p className="border-b border-[#cbb67f]/20 pb-4 font-mono text-[8px] uppercase tracking-[0.2em]">
                                CURATED ARTISTS
                              </p>
                              <div className="mt-4">
                                {affiliateDirectory.map((affiliateEntry, index) => (
                                  <div
                                    key={affiliateEntry.id}
                                    className={`block w-full border-b border-[#d2ba81]/15 py-3 text-left font-display text-lg uppercase md:text-2xl ${menuIndex === index ? "text-[#f2dfb5]" : "text-[#c0ae85]/60"}`}
                                  >
                                    {affiliateEntry.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="absolute inset-0 bg-[#09100c] p-5 text-[#ded3bc] md:p-8">
                              <div className="absolute left-5 top-5 font-mono text-[8px] uppercase tracking-[0.2em] text-white/60 md:left-8 md:top-8">
                                <span>{channelLabel}</span><br />{identity}
                              </div>
                              <div className="absolute left-1/2 top-[22%] -translate-x-1/2 text-center font-mono text-sm font-bold uppercase tracking-[0.2em] text-[#d94337] md:text-lg" style={{ textShadow: "1px 0 0 rgba(255,80,65,.7), -1px 0 0 rgba(120,20,18,.65), 0 1px 0 rgba(120,20,18,.65)" }}>
                                {identity}
                              </div>
                              {view === "CHANNEL_MENU" || view === "SONGS_MENU" ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center font-mono text-xl font-bold tracking-[0.16em] md:text-3xl">
                                  {(view === "CHANNEL_MENU" ? ["SONGS", "VIDEOS"] : ["ALBUMS AND EPs", "SINGLES", "EXCLUSIVE PREVIEW"]).map((item, index) => (
                                    <div key={item} className={menuIndex === index ? "text-[#f2dfb5] [text-shadow:0_0_10px_rgba(242,223,181,.55)]" : "text-[#c0ae85]/55"}>{menuIndex === index ? "> " : ""}{item}</div>
                                  ))}
                                </div>
                              ) : view === "VIDEOS_MENU" ? (
                                <div className="absolute inset-0 flex items-center justify-center text-center font-mono text-xl font-bold tracking-[0.16em] text-[#f2dfb5] md:text-3xl">
                                  {currentChannel.media.videos.length ? currentChannel.media.videos[menuIndex]?.title : "NOTHING YET"}
                                </div>
                              ) : view === "VIDEO_PLAYER" ? (
                                <div className="absolute inset-0 flex items-center justify-center text-center font-mono text-lg tracking-[0.14em] text-[#f2dfb5]">NOTHING YET</div>
                              ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center font-mono text-xl font-bold tracking-[0.12em] text-[#f2dfb5] md:text-3xl">
                                  {(currentChannel.media[view === "ALBUMS_EPS" ? "albumsEps" : view === "SINGLES" ? "singles" : "exclusivePreview"] ?? []).length
                                    ? (currentChannel.media[view === "ALBUMS_EPS" ? "albumsEps" : view === "SINGLES" ? "singles" : "exclusivePreview"] ?? []).map((item) => <div key={item}>{item}</div>)
                                    : "NOTHING YET"}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {/* curved CRT shadow */}

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
                          {view === "HOME"
                            ? "H"
                            : view === "AFFILIATE_INTRO" ||
                                view === "AFFILIATE_DIRECTORY" ||
                                signalSource === "affiliate"
                              ? "A"
                              : String(selectedChannel + 1).padStart(2, "0")}
                        </span>

                        <span className="font-mono text-[11px] uppercase text-white/50">
                          {view === "HOME"
                            ? "START"
                            : view === "AFFILIATE_INTRO" ||
                                view === "AFFILIATE_DIRECTORY"
                              ? "CURATED ARTISTS"
                              : identity}
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
                        className="remote-direction-button"
                      >
                        ▲
                      </button>


                      <button
                        type="button"
                        onClick={() => changeChannel(-1)}
                        className="remote-direction-button"
                      >
                        ▼
                      </button>

                    </div>

                  </div>


                  {/* dpad */}
                  <div className="mt-4 flex justify-center">
                    <div className="broadcast-remote-dpad relative h-[115px] w-[115px] rounded-full border-2 border-black bg-[#101010] shadow-[inset_0_5px_10px_rgba(0,0,0,.85)]">
                      <button type="button" onClick={() => navigateMenu(-1)} className="absolute left-1/2 top-3 -translate-x-1/2 font-mono text-[13px] text-white/45 hover:text-white">▲</button>
                      <button type="button" onClick={() => navigateMenu(1)} className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[13px] text-white/45 hover:text-white">▼</button>
                      <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-white/45 hover:text-white">◀</button>
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-white/45 hover:text-white">▶</button>
                      <button type="button" onClick={selectMenuItem} className="broadcast-remote-ok absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black bg-[#282828]">
                        <span className="font-mono text-[9px] font-bold tracking-[0.15em] text-white/55">OK</span>
                      </button>
                    </div>
                  </div>
                  {/* destinations */}
                  <div className="broadcast-remote-custom mt-4">
                    <p className="mb-2 font-mono text-[13px] uppercase tracking-[0.08em] text-white/55">Destination</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" onClick={() => openSection("MUSIC")} className={`remote-destination-button ${view === "SONGS_MENU" ? "remote-destination-active" : ""}`}>MUSIC</button>
                      <button type="button" onClick={() => openSection("VIDEOS")} className={`remote-destination-button ${view === "VIDEOS_MENU" ? "remote-destination-active" : ""}`}>VIDEOS</button>
                      <div className="flex flex-col gap-2">
                        <button type="button" onClick={goBack} className="remote-destination-button py-1">BACK</button>
                        <button type="button" onClick={openAffiliateIntro} className={`remote-destination-button ${view === "AFFILIATE_INTRO" || view === "AFFILIATE_DIRECTORY" || signalSource === "affiliate" ? "remote-destination-active" : ""}`}>EXTRA</button>
                      </div>
                    </div>
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
          {view === "HOME"
            ? "HOME / START"
            : view === "AFFILIATE_INTRO"
              ? "CURATED ARTISTS / START"
            : view === "AFFILIATE_DIRECTORY"
              ? "CURATED ARTISTS"
              : signalSource === "affiliate"
                ? `CURATED ARTISTS / ${identity}`
                : `${channelLabel} / ${member.name}`}
        </span>
        <span>{powerOn ? "signal detected" : "transmission ended"}</span>
      </div>
    </section>
  )
}
