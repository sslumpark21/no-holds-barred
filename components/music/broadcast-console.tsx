"use client"

import Image from "next/image"
import Link from "next/link"
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react"

import { latestRelease } from "@/lib/data"

type Mode = "MUSIC" | "VIDEO" | "ARCHIVE" | "INFO"

const modes: Mode[] = [
  "MUSIC",
  "VIDEO",
  "ARCHIVE",
  "INFO",
]

const lightByMode: Record<
  Mode,
  {
    glow: string
    edge: string
    haze: string
  }
> = {
  MUSIC: {
    glow: "rgba(159, 192, 151, 0.32)",
    edge: "rgba(202, 176, 98, 0.11)",
    haze: "rgba(128, 151, 103, 0.12)",
  },

  VIDEO: {
    glow: "rgba(123, 170, 157, 0.34)",
    edge: "rgba(62, 87, 119, 0.13)",
    haze: "rgba(66, 102, 94, 0.13)",
  },

  ARCHIVE: {
    glow: "rgba(203, 181, 111, 0.28)",
    edge: "rgba(140, 92, 50, 0.12)",
    haze: "rgba(161, 133, 77, 0.12)",
  },

  INFO: {
    glow: "rgba(152, 76, 57, 0.27)",
    edge: "rgba(100, 30, 25, 0.17)",
    haze: "rgba(105, 49, 38, 0.12)",
  },
}

export function BroadcastConsole() {
  const tracks = latestRelease.tracklist

  const [powerOn, setPowerOn] = useState(true)
  const [selectedTrack, setSelectedTrack] = useState(0)

  const [selectedMode, setSelectedMode] =
    useState<Mode>("MUSIC")

  const [screenMode, setScreenMode] =
    useState<Mode>("MUSIC")

  const [signalActive, setSignalActive] =
    useState(false)

  const [flashActive, setFlashActive] =
    useState(false)

  const remoteRef =
    useRef<HTMLDivElement | null>(null)

  const track = tracks[selectedTrack]

  const light = lightByMode[screenMode]

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

  const previousChannel = () => {
    triggerSignal(() => {
      setSelectedTrack((current) =>
        current === 0
          ? tracks.length - 1
          : current - 1
      )
    })
  }

  const nextChannel = () => {
    triggerSignal(() => {
      setSelectedTrack((current) =>
        current === tracks.length - 1
          ? 0
          : current + 1
      )
    })
  }

  const moveMode = (
    direction: number
  ) => {
    const current =
      modes.indexOf(selectedMode)

    const next =
      (current +
        direction +
        modes.length) %
      modes.length

    setSelectedMode(modes[next])

    setSignalActive(true)

    window.setTimeout(() => {
      setSignalActive(false)
    }, 120)
  }

  const selectMode = (
    mode: Mode
  ) => {
    triggerSignal(() => {
      setSelectedMode(mode)
      setScreenMode(mode)
      setPowerOn(true)
    })
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
          CHANNEL FLASH
          ================================================= */}

      <div
        className={`pointer-events-none absolute inset-0 z-40 transition-opacity duration-200 ${
          flashActive && powerOn
            ? "opacity-100"
            : "opacity-0"
        }`}
        style={{
          background:
            light.glow,
          mixBlendMode:
            "screen",
        }}
      />


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

          <div className="relative">


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


            {/* TV floor shadow */}

            <div className="absolute -bottom-11 left-[5%] right-[5%] h-16 rounded-full bg-black/80 blur-2xl" />


            {/* MAIN BODY */}

            <div className="relative rounded-[22px] border-[3px] border-[#15130f] bg-gradient-to-br from-[#413d36] via-[#282621] to-[#171613] p-4 shadow-[0_30px_70px_rgba(0,0,0,.85)] md:p-5">

              <div className="pointer-events-none absolute inset-[5px] rounded-[17px] border border-white/[0.055]" />


              {/* top label */}

              <div className="mb-3 flex justify-between px-2 font-mono text-[6px] uppercase tracking-[0.2em] text-[#a89f8e]/24">

                <span>
                  no.holds television
                </span>

                <span>
                  NHB-TV 001
                </span>

              </div>


              {/* front */}

              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">


                {/* SCREEN HOUSING */}

                <div className="relative rounded-[18px] border-[3px] border-[#12110e] bg-gradient-to-br from-[#69645a] via-[#403d36] to-[#25231f] p-3 shadow-[inset_0_2px_5px_rgba(255,255,255,.06),inset_0_-4px_8px_rgba(0,0,0,.55)]">

                  <div className="relative rounded-[15px] border-[3px] border-[#716c61] bg-[#1b1a17] p-2">

                    {/* SCREEN */}

                    <div
                      className={`relative aspect-[4/3] overflow-hidden rounded-[11%] border-[4px] border-black bg-black shadow-[inset_0_0_70px_rgba(0,0,0,1)] ${
                        powerOn
                          ? "nhb-screen-flicker"
                          : ""
                      }`}
                    >


                      {/* POWER OFF */}

                      {!powerOn && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#010201]">

                          <div className="h-[2px] w-[55%] bg-white/12 blur-[1px]" />

                        </div>
                      )}


                      {/* POWER ON */}

                      {powerOn && (
                        <>

                          {/* MUSIC */}

                          {screenMode ===
                            "MUSIC" && (
                            <div className="absolute inset-0">

                              <Image
                                src={
                                  latestRelease.artwork ||
                                  "/placeholder.svg"
                                }
                                alt=""
                                fill
                                sizes="900px"
                                className="object-cover opacity-[0.78] brightness-[0.83] contrast-[1.1] saturate-[0.8]"
                              />

                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/20" />


                              <div className="absolute inset-0 flex flex-col justify-between p-5 text-white md:p-8">

                                <div className="flex justify-between font-mono text-[8px] uppercase tracking-[0.2em] text-white/60">

                                  <span>
                                    CH{" "}
                                    {String(
                                      selectedTrack +
                                        1
                                    ).padStart(
                                      2,
                                      "0"
                                    )}
                                  </span>

                                  <span>
                                    MUSIC
                                  </span>

                                </div>


                                <div>

                                  <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/50">
                                    {
                                      latestRelease.artistName
                                    }
                                  </p>

                                  <h3 className="mt-2 font-display text-[8vw] leading-[0.76] tracking-[-0.055em] uppercase md:text-[4.6vw]">
                                    {
                                      track.title
                                    }
                                  </h3>


                                  <div className="mt-5 h-[2px] w-full bg-white/20">

                                    <div className="h-full w-[38%] bg-white/75" />

                                  </div>


                                  <div className="mt-2 flex justify-between font-mono text-[7px] uppercase tracking-[0.15em] text-white/45">

                                    <span>
                                      PLAYING
                                    </span>

                                    <span>
                                      {
                                        track.duration
                                      }
                                    </span>

                                  </div>

                                </div>

                              </div>

                            </div>
                          )}


                          {/* VIDEO */}

                          {screenMode ===
                            "VIDEO" && (
                            <div className="absolute inset-0 bg-[#09100c]">

                              <Image
                                src={
                                  latestRelease.artwork ||
                                  "/placeholder.svg"
                                }
                                alt=""
                                fill
                                sizes="900px"
                                className="object-cover opacity-[0.32] grayscale brightness-[0.7]"
                              />

                              <div
                                className="absolute inset-0"
                                style={{
                                  background:
                                    "radial-gradient(circle at center, rgba(143,176,154,.14), rgba(0,0,0,.65))",
                                }}
                              />


                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-[#d5dfd3]">

                                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/40">
                                  VIDEO INPUT
                                </p>

                                <p className="mt-4 font-display text-[10vw] leading-[0.8] uppercase md:text-[5.5vw]">
                                  Video
                                </p>

                                <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">
                                  waiting for
                                  transmission
                                </p>

                              </div>

                            </div>
                          )}


                          {/* ARCHIVE */}

                          {screenMode ===
                            "ARCHIVE" && (
                            <div className="absolute inset-0 overflow-y-auto bg-[#11100b] p-5 text-[#d4c49d] md:p-8">

                              <div className="flex justify-between border-b border-[#cbb67f]/15 pb-4">

                                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#c0ae85]/45">
                                  NHB ARCHIVE
                                </span>

                                <span className="font-mono text-[8px] text-[#c0ae85]/35">
                                  001
                                </span>

                              </div>


                              <div className="mt-6">

                                {tracks
                                  .slice(0, 6)
                                  .map(
                                    (
                                      item,
                                      index
                                    ) => (

                                      <button
                                        key={
                                          item.id
                                        }
                                        type="button"
                                        onClick={() =>
                                          triggerSignal(
                                            () => {
                                              setSelectedTrack(
                                                index
                                              )

                                              setScreenMode(
                                                "MUSIC"
                                              )

                                              setSelectedMode(
                                                "MUSIC"
                                              )
                                            }
                                          )
                                        }
                                        className="group flex w-full items-center justify-between border-b border-[#d2ba81]/10 py-3 text-left"
                                      >

                                        <div className="flex items-center gap-4">

                                          <span className="font-mono text-[8px] text-[#a98d5f]/40">
                                            {String(
                                              index +
                                                1
                                            ).padStart(
                                              2,
                                              "0"
                                            )}
                                          </span>

                                          <span className="font-display text-lg uppercase transition-transform group-hover:translate-x-2 md:text-2xl">
                                            {
                                              item.title
                                            }
                                          </span>

                                        </div>


                                        <span className="font-mono text-[7px] text-[#aa9268]/35">
                                          {
                                            item.duration
                                          }
                                        </span>

                                      </button>

                                    )
                                  )}

                              </div>

                            </div>
                          )}


                          {/* INFO */}

                          {screenMode ===
                            "INFO" && (
                            <div className="absolute inset-0 flex flex-col justify-between bg-[#150b08] p-5 text-[#dac7b0] md:p-8">

                              <div>

                                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#d1a494]/40">
                                  Channel
                                  information
                                </p>

                                <p className="mt-5 font-display text-[8vw] leading-[0.8] tracking-[-0.05em] uppercase md:text-[4.5vw]">
                                  {
                                    latestRelease.artistName
                                  }
                                </p>

                              </div>


                              <div className="border-t border-[#d5a28c]/15 pt-5">

                                <p className="max-w-lg text-sm leading-relaxed text-[#c0a897]/55">
                                  Currently
                                  transmitting{" "}
                                  {
                                    latestRelease.title
                                  }
                                  . Music,
                                  visual work,
                                  releases and
                                  ongoing material.
                                </p>


                                <Link
                                  href={`/releases/${latestRelease.slug}`}
                                  className="mt-5 inline-block border-b border-[#d4a28e]/25 pb-1 font-mono text-[8px] uppercase tracking-[0.2em]"
                                >
                                  Enter channel
                                  ↗
                                </Link>

                              </div>

                            </div>
                          )}

                        </>
                      )}


                      {/* curved CRT shadow */}

                      <div className="pointer-events-none absolute inset-0 rounded-[11%] bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,.5)_100%)]" />


                      {/* scanlines */}

                      <div className="pointer-events-none absolute inset-0 opacity-[0.15] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,.1)_0px,rgba(255,255,255,.1)_1px,transparent_1px,transparent_4px)]" />


                      {/* screen reflection */}

                      <div className="pointer-events-none absolute left-[7%] top-[4%] h-[27%] w-[53%] rotate-[-8deg] rounded-[50%] bg-white/[0.05] blur-xl" />


                      {/* static texture */}

                      <div className="nhb-static pointer-events-none absolute inset-0 opacity-[0.035] bg-[repeating-radial-gradient(circle_at_center,#fff_0px,transparent_1px,transparent_3px)]" />


                      {/* channel flash */}

                      <div
                        className={`pointer-events-none absolute inset-0 transition-opacity duration-150 ${
                          flashActive
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                        style={{
                          background:
                            light.glow,
                          mixBlendMode:
                            "screen",
                        }}
                      />

                    </div>

                  </div>

                </div>


                {/* RIGHT CONTROL PANEL */}

                <div className="flex flex-col gap-4 rounded-[12px] border border-black/40 bg-gradient-to-b from-[#302d27] to-[#181714] p-3">


                  {/* speaker */}

                  <div className="relative min-h-[180px] flex-1 overflow-hidden rounded-[5px] border border-black/50 bg-[#171410]">

                    <div className="absolute inset-0 opacity-80 bg-[repeating-linear-gradient(0deg,#493a2e_0px,#493a2e_2px,#1a1511_2px,#1a1511_6px)]" />

                    <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-black/30" />

                  </div>


                  <div className="grid grid-cols-[38px_1fr] gap-3">


                    {/* button stack */}

                    <div className="flex flex-col justify-center gap-2">

                      {[
                        "PWR",
                        "CH",
                        "VOL",
                        "AUX",
                      ].map(
                        (label) => (

                          <div
                            key={
                              label
                            }
                            className="flex flex-col items-center gap-1"
                          >

                            <div className="h-5 w-5 rounded-full border border-black/60 bg-gradient-to-br from-[#77736a] to-[#2b2924]" />

                            <span className="font-mono text-[4px] uppercase text-[#a89d8b]/25">
                              {
                                label
                              }
                            </span>

                          </div>

                        )
                      )}

                    </div>


                    {/* dials */}

                    <div className="flex flex-col items-center justify-center gap-4">

                      <div className="relative h-[70px] w-[70px] rounded-full border-[3px] border-[#11100e] bg-[#090908] shadow-[inset_0_0_8px_black]">

                        <div className="absolute inset-[8px] rounded-full border border-white/10 bg-[repeating-conic-gradient(from_0deg,#211f1b_0deg_8deg,#070706_8deg_14deg)]" />

                        <div className="absolute left-1/2 top-1/2 h-[3px] w-[24px] origin-left -translate-y-1/2 rotate-[-45deg] bg-[#aaa493]/60" />

                      </div>


                      <div className="relative h-[64px] w-[64px] rounded-full border-[3px] border-[#11100e] bg-[#090908] shadow-[inset_0_0_8px_black]">

                        <div className="absolute inset-[8px] rounded-full border border-white/10 bg-[repeating-conic-gradient(from_0deg,#211f1b_0deg_10deg,#070706_10deg_16deg)]" />

                        <div className="absolute left-1/2 top-1/2 h-[3px] w-[21px] origin-left -translate-y-1/2 rotate-[25deg] bg-[#aaa493]/60" />

                      </div>

                    </div>

                  </div>

                </div>

              </div>


              {/* TV lower label */}

              <div className="mt-4 flex items-center justify-between border-t border-black/40 px-2 pt-3 font-mono text-[6px] uppercase tracking-[0.18em] text-[#9f9687]/24">

                <span>
                  CH{" "}
                  {String(
                    selectedTrack + 1
                  ).padStart(2, "0")}
                  {" / "}
                  {screenMode}
                </span>


                <div className="flex items-center gap-3">

                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      powerOn
                        ? "bg-[#9a2920] shadow-[0_0_7px_rgba(180,40,30,.55)]"
                        : "bg-[#321512]"
                    }`}
                  />

                  <span>
                    vhf / uhf
                  </span>

                </div>

              </div>

            </div>


            {/* plinth */}

            <div className="relative mx-[-12px] h-8 rounded-b-[8px] border-x-2 border-b-2 border-[#14120f] bg-gradient-to-b from-[#322922] to-[#12100d] shadow-[0_8px_8px_rgba(0,0,0,.55)]" />


            {/* feet */}

            <div className="flex justify-between px-10">

              <div className="h-3 w-20 rounded-b bg-[#0d0c0a]" />

              <div className="h-3 w-20 rounded-b bg-[#0d0c0a]" />

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
                          {String(
                            selectedTrack +
                              1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </span>

                        <span className="font-mono text-[11px] uppercase text-white/50">
                          {
                            selectedMode
                          }
                        </span>

                      </div>

                    </div>

                  </div>


                  {/* home / power */}

                  <div className="mt-4 grid grid-cols-2 gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        triggerSignal(
                          () => {
                            setSelectedMode(
                              "MUSIC"
                            )

                            setScreenMode(
                              "MUSIC"
                            )

                            setPowerOn(
                              true
                            )
                          }
                        )
                      }
                      className="remote-black-button"
                    >
                      HOME
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        triggerSignal(
                          () =>
                            setPowerOn(
                              (
                                current
                              ) =>
                                !current
                            )
                        )
                      }
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
                        onClick={
                          previousChannel
                        }
                        className="remote-direction-button"
                      >
                        ▲
                      </button>


                      <button
                        type="button"
                        onClick={
                          nextChannel
                        }
                        className="remote-direction-button"
                      >
                        ▼
                      </button>

                    </div>

                  </div>


                  {/* dpad */}

                  <div className="mt-4 flex justify-center">

                    <div className="relative h-[115px] w-[115px] rounded-full border-2 border-black bg-[#101010] shadow-[inset_0_5px_10px_rgba(0,0,0,.85)]">

                      <button
                        type="button"
                        onClick={() =>
                          moveMode(-1)
                        }
                        className="absolute left-1/2 top-3 -translate-x-1/2 font-mono text-[13px] text-white/45 hover:text-white"
                      >
                        ▲
                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          moveMode(1)
                        }
                        className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[13px] text-white/45 hover:text-white"
                      >
                        ▼
                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          moveMode(-1)
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-white/45 hover:text-white"
                      >
                        ◀
                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          moveMode(1)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-white/45 hover:text-white"
                      >
                        ▶
                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          selectMode(
                            selectedMode
                          )
                        }
                        className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black bg-[#282828]"
                      >
                        <span className="font-mono text-[9px] font-bold tracking-[0.15em] text-white/55">
                          OK
                        </span>
                      </button>

                    </div>

                  </div>


                  {/* destinations */}

                  <div className="mt-4">

                    <p className="mb-2 font-mono text-[7px] uppercase tracking-[0.18em] text-white/22">
                      Destination
                    </p>

                    <div className="grid grid-cols-4 gap-2">

                      {modes.map(
                        (mode) => (

                          <button
                            key={
                              mode
                            }
                            type="button"
                            onClick={() =>
                              selectMode(
                                mode
                              )
                            }
                            className={`remote-destination-button ${
                              selectedMode ===
                              mode
                                ? "remote-destination-active"
                                : ""
                            }`}
                          >
                            {mode}
                          </button>

                        )
                      )}

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
          CH{" "}
          {String(
            selectedTrack + 1
          ).padStart(2, "0")}
          {" / "}
          {track.title}
        </span>

        <span>
          {powerOn
            ? `${screenMode} transmission`
            : "transmission ended"}
        </span>

      </div>

    </section>
  )
}