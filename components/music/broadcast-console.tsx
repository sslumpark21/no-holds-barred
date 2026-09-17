"use client"

import Image from "next/image"
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react"

import { artists } from "@/lib/data"

const lightByChannel = [
  { glow: "rgba(159, 192, 151, 0.32)", edge: "rgba(202, 176, 98, 0.11)", haze: "rgba(128, 151, 103, 0.12)" },
  { glow: "rgba(123, 170, 157, 0.34)", edge: "rgba(62, 87, 119, 0.13)", haze: "rgba(66, 102, 94, 0.13)" },
  { glow: "rgba(203, 181, 111, 0.28)", edge: "rgba(140, 92, 50, 0.12)", haze: "rgba(161, 133, 77, 0.12)" },
]

type View =
  | "HOME"
  | "MEMBER_CHANNEL"
  | "MUSIC"
  | "VIDEOS"
  | "AFFILIATE_INTRO"
  | "AFFILIATE_DIRECTORY"
  | "AFFILIATE_CHANNEL"

type SignalSource = "member" | "affiliate"
type PowerPhase = "on" | "starting" | "stopping" | "off"

const affiliateDirectory = [
  "Andreas Shinso",
  "Cyupercah",
  "moise6969",
  "2007",
]

export function BroadcastConsole() {
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

  const member = artists[selectedChannel]
  const light = lightByChannel[selectedChannel]
  const affiliateName =
    affiliateIndex === null ? null : affiliateDirectory[affiliateIndex]
  const identity =
    signalSource === "affiliate" && affiliateName ? affiliateName : member.name
  const channelLabel = `CH ${String(selectedChannel + 1).padStart(2, "0")}`

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
    setView("MEMBER_CHANNEL")
  }

  const changeChannel = (direction: -1 | 1) => {
    if (
      !powerOn ||
      powerPhase !== "on" ||
      view === "HOME" ||
      view === "AFFILIATE_INTRO" ||
      view === "AFFILIATE_DIRECTORY"
    ) return

    const inAffiliateSystem =
      view === "AFFILIATE_CHANNEL" ||
      ((view === "MUSIC" || view === "VIDEOS") &&
        signalSource === "affiliate")

    if (inAffiliateSystem) {
      setAffiliateIndex((current) =>
        ((current ?? 0) + direction + affiliateDirectory.length) %
        affiliateDirectory.length
      )
      triggerSignal(() => {})
      return
    }

    const next =
      (channelRef.current + direction + artists.length) % artists.length
    channelRef.current = next
    setSelectedChannel(next)
    setSignalSource("member")
    if (view !== "MUSIC" && view !== "VIDEOS") {
      setView("MEMBER_CHANNEL")
    }

    clearTransition()
    setTransitionId((current) => current + 1)
    setTransitioning(true)
    triggerSignal(() => {})
    transitionTimerRef.current = window.setTimeout(() => {
      setTransitioning(false)
      transitionTimerRef.current = null
    }, 300)
  }

  const navigateMenu = (direction: -1 | 1) => {
    if (powerPhase !== "on" || transitioning) return
    if (view === "AFFILIATE_DIRECTORY") {
      setMenuIndex((current) =>
        (current + direction + affiliateDirectory.length) %
        affiliateDirectory.length
      )
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
      setView("AFFILIATE_CHANNEL")
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
    setView(section)
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
            <div className="relative aspect-[1254/830] w-full overflow-hidden drop-shadow-[0_30px_50px_rgba(0,0,0,0.85)]">

                    <div
                      className={`absolute left-[8.5%] top-[10.2%] z-10 h-[72.8%] w-[64.2%] overflow-hidden rounded-[11%] bg-black shadow-[inset_0_0_70px_rgba(0,0,0,1)] ${
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
                                AFFILIATE
                              </p>
                              <p className="font-mono text-sm tracking-[0.16em] text-[#d94337] [text-shadow:0_0_12px_rgba(217,48,38,.7)] md:text-lg">
                                Press OK
                              </p>
                            </div>
                          ) : view === "AFFILIATE_DIRECTORY" ? (
                            <div className="absolute inset-0 overflow-y-auto bg-[#11100b] p-5 text-[#d4c49d] md:p-8">
                              <p className="border-b border-[#cbb67f]/20 pb-4 font-mono text-[8px] uppercase tracking-[0.2em]">
                                AFFILIATE
                              </p>
                              <div className="mt-4">
                                {affiliateDirectory.map((name, index) => (
                                  <div
                                    key={name}
                                    className={`block w-full border-b border-[#d2ba81]/15 py-3 text-left font-display text-lg uppercase md:text-2xl ${menuIndex === index ? "text-[#f2dfb5]" : "text-[#c0ae85]/60"}`}
                                  >
                                    {name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : view === "MEMBER_CHANNEL" ? (
                            <>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/20" />
                              <div className="absolute inset-0 flex flex-col justify-between p-5 text-white md:p-8">
                                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/60">{channelLabel}</span>
                                <h3 className="font-display text-[8vw] leading-[0.76] tracking-[-0.055em] uppercase md:text-[4.6vw]">{member.name}</h3>
                              </div>
                            </>
                          ) : view === "AFFILIATE_CHANNEL" ? (
                            <div className="absolute inset-0 flex flex-col justify-between bg-[#09100c] p-5 text-[#ded3bc] md:p-8" style={{ containerType: "inline-size" }}>
                              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/60">AFFILIATE SIGNAL</span>
                              <div>
                                <h3 className="max-w-full whitespace-nowrap font-display leading-[0.85] tracking-[-0.055em] uppercase" style={{ fontSize: (affiliateName?.length ?? 0) > 11 ? "clamp(0.9rem, 7.8cqw, 3rem)" : "clamp(1.3rem, 8.4cqw, 3.5rem)" }}>{affiliateName}</h3>
                                <p className="mt-5 font-mono text-[8px] uppercase tracking-[0.2em] text-white/60">TO BE ANNOUNCED</p>
                              </div>
                            </div>
                          ) : (
                            <div className="absolute inset-0 flex flex-col justify-between bg-[#09100c] p-5 text-[#ded3bc] md:p-8">
                              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/60">
                                {signalSource === "member" ? channelLabel : "AFFILIATE SIGNAL"} / {identity}
                              </span>
                              <div>
                                <h3 className="font-display text-[8vw] leading-[0.76] tracking-[-0.055em] uppercase md:text-[4.6vw]">{view}</h3>
                                <p className="mt-5 font-mono text-[8px] uppercase tracking-[0.2em] text-white/60">TO BE ANNOUNCED</p>
                              </div>
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
                width={1254}
                height={1254}
                priority
                className="pointer-events-none absolute left-0 top-[-24.7%] z-20 h-auto w-full select-none"
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

                <div className="relative rounded-[34px] border-2 border-[#080808] bg-[#1b1b1a] px-5 pb-6 pt-5 shadow-[0_28px_55px_rgba(0,0,0,.72)]">

                  <div className="pointer-events-none absolute inset-[6px] rounded-[29px] border border-white/[0.07]" />


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

                  <div className="rounded-[10px] border border-black bg-[#070707] p-2 shadow-[inset_0_3px_8px_rgba(0,0,0,.9)]">

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
                              ? "AFFILIATE"
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
                      className="remote-black-button"
                    >
                      HOME
                    </button>


                    <button
                      type="button"
                      onClick={togglePower}
                      className="remote-black-button"
                    >
                      POWER
                    </button>

                  </div>


                  {/* channel */}

                  <div className="mt-4 rounded-[13px] border border-white/[0.07] bg-[#242424] p-3">

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
                    <div className="relative h-[115px] w-[115px] rounded-full border-2 border-black bg-[#101010] shadow-[inset_0_5px_10px_rgba(0,0,0,.85)]">
                      <button type="button" onClick={() => navigateMenu(-1)} className="absolute left-1/2 top-3 -translate-x-1/2 font-mono text-[13px] text-white/45 hover:text-white">▲</button>
                      <button type="button" onClick={() => navigateMenu(1)} className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[13px] text-white/45 hover:text-white">▼</button>
                      <button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-white/45 hover:text-white">◀</button>
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-white/45 hover:text-white">▶</button>
                      <button type="button" onClick={selectMenuItem} className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black bg-[#282828]">
                        <span className="font-mono text-[9px] font-bold tracking-[0.15em] text-white/55">OK</span>
                      </button>
                    </div>
                  </div>
                  {/* destinations */}
                  <div className="mt-4">
                    <p className="mb-2 font-mono text-[7px] uppercase tracking-[0.18em] text-white/22">Destination</p>
                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" onClick={() => openSection("MUSIC")} className={`remote-destination-button ${view === "MUSIC" ? "remote-destination-active" : ""}`}>MUSIC</button>
                      <button type="button" onClick={() => openSection("VIDEOS")} className={`remote-destination-button ${view === "VIDEOS" ? "remote-destination-active" : ""}`}>VIDEOS</button>
                      <button type="button" onClick={openAffiliateIntro} className={`remote-destination-button ${view === "AFFILIATE_INTRO" || view === "AFFILIATE_DIRECTORY" || view === "AFFILIATE_CHANNEL" ? "remote-destination-active" : ""}`}>AFFILIATE</button>
                    </div>
                  </div>
                  <div className="mt-5 flex justify-between border-t border-white/[0.07] pt-3 font-mono text-[6px] uppercase tracking-[0.15em] text-white/17">

                    <span>
                      use responsibly
                    </span>

                    <span>
                      do not lose
                    </span>

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
              ? "AFFILIATE / START"
            : view === "AFFILIATE_DIRECTORY"
              ? "AFFILIATE DIRECTORY"
              : signalSource === "affiliate"
                ? `AFFILIATE / ${identity}`
                : `${channelLabel} / ${member.name}`}
        </span>
        <span>{powerOn ? "signal detected" : "transmission ended"}</span>
      </div>
    </section>
  )
}
