"use client"

import Image from "next/image"
import Link from "next/link"
import {
  useEffect,
  useRef,
  type CSSProperties,
} from "react"

import { BroadcastConsole } from "@/components/music/broadcast-console"
import { ChannelWindows } from "@/components/home/channel-windows"

export default function HomePage() {
  const heroRef =
    useRef<HTMLElement | null>(null)

  useEffect(() => {
    const hero = heroRef.current

    if (!hero) return

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
        hero.getBoundingClientRect()

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

      hero.style.setProperty(
        "--mx",
        x.toString()
      )

      hero.style.setProperty(
        "--my",
        y.toString()
      )
    }

    const handleLeave = () => {
      hero.style.setProperty("--mx", "0")
      hero.style.setProperty("--my", "0")
    }

    hero.addEventListener(
      "pointermove",
      handleMove
    )

    hero.addEventListener(
      "pointerleave",
      handleLeave
    )

    return () => {
      hero.removeEventListener(
        "pointermove",
        handleMove
      )

      hero.removeEventListener(
        "pointerleave",
        handleLeave
      )
    }
  }, [])

  const heroStyle = {
    "--mx": "0",
    "--my": "0",
  } as CSSProperties

  return (
    <main
      id="top"
      className="min-h-screen bg-[#030403] text-[#ded3bc]"
    >
      <style>
        {`
          .nhb-outline {
            -webkit-text-stroke:
              1px rgba(3, 4, 3, 0.9);

            text-shadow:
              -1px -1px 0 rgba(0,0,0,.8),
              1px -1px 0 rgba(0,0,0,.8),
              -1px 1px 0 rgba(0,0,0,.8),
              1px 1px 0 rgba(0,0,0,.8),
              0 5px 18px rgba(0,0,0,.75);
          }

          .nhb-small-readable {
            text-shadow:
              0 1px 2px rgba(0,0,0,.95),
              0 0 6px rgba(0,0,0,.6);
          }

          @keyframes nhbHeroGlow {
            0%,100% {
              opacity: .45;
            }

            50% {
              opacity: .68;
            }
          }

          .nhb-hero-glow {
            animation:
              nhbHeroGlow
              6s
              ease-in-out
              infinite;
          }
        `}
      </style>


      {/* ================================================
          INTRO
          ================================================ */}

      <section
        ref={heroRef}
        style={heroStyle}
        className="relative h-[76vh] min-h-[560px] overflow-hidden bg-[#040504]"
      >
        <div
          className="absolute inset-[-3%] transition-transform duration-700 ease-out"
          style={{
            transform:
              "translate3d(calc(var(--mx) * -9px), calc(var(--my) * -5px), 0) scale(1.05)",
          }}
        >
          <Image
            src="/images/hero.png"
            alt="no.holds barred"
            fill
            priority
            sizes="100vw"
            className="object-cover brightness-[0.38] contrast-[1.16] saturate-[0.65]"
          />
        </div>


        {/* warm night light */}

        <div
          className="nhb-hero-glow pointer-events-none absolute inset-0"
          style={{
            background: `
              radial-gradient(
                circle at 72% 36%,
                rgba(177, 187, 95, .15),
                transparent 28%
              ),
              radial-gradient(
                circle at 27% 72%,
                rgba(138, 52, 35, .19),
                transparent 38%
              )
            `,
          }}
        />


        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/20 to-[#030403]/95" />

        <div className="pointer-events-none absolute inset-0 opacity-[0.1] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,.09)_0px,rgba(255,255,255,.09)_1px,transparent_1px,transparent_5px)]" />


        <div className="relative z-10 flex h-full flex-col justify-between px-4 py-7 md:px-7 md:py-9">

          <div className="flex items-start justify-between gap-6">

            <div className="flex items-center gap-3 border border-[#d1b986]/20 bg-black/40 px-3 py-2">

              <span className="h-2 w-2 rounded-full bg-[#ad3429] shadow-[0_0_10px_rgba(200,50,40,.8)]" />

              <span className="nhb-small-readable font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-[#e0d2b7]/80">
                Live after midnight
              </span>

            </div>


            <div className="nhb-small-readable hidden text-right font-mono text-[8px] font-semibold uppercase leading-relaxed tracking-[0.2em] text-[#d0c1a6]/70 sm:block">
              NHB / 001
              <br />
              Independent transmission
            </div>

          </div>


          <div
            className="transition-transform duration-500 ease-out"
            style={{
              transform:
                "translate3d(calc(var(--mx) * 7px), calc(var(--my) * 3px), 0)",
            }}
          >
            <p className="nhb-small-readable mb-4 font-mono text-[8px] font-bold uppercase tracking-[0.28em] text-[#d8c8aa]/75">
              Music · image · noise · people
            </p>


            <h1 className="nhb-outline font-display text-[19vw] leading-[0.7] tracking-[-0.06em] text-[#d4c8b0] md:text-[13vw]">
              no.holds
              <br />
              barred
            </h1>


            <div className="mt-7 flex flex-col gap-5 border-t border-[#d9c197]/20 pt-5 md:flex-row md:items-end md:justify-between">

              <p className="nhb-small-readable max-w-md text-sm font-medium leading-relaxed text-[#d0c2a8]/78">
                Independent music and creative
                transmissions from somewhere after
                midnight.
              </p>


              <div className="nhb-small-readable flex items-center gap-4 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#d5c5a6]/70">

                <span>
                  CH 001
                </span>

                <span className="h-px w-10 bg-[#d5c5a6]/40" />

                <span>
                  Tune in below
                </span>

              </div>

            </div>

          </div>


          <div className="flex items-end justify-between gap-6">

            <span className="nhb-small-readable font-mono text-[7px] font-semibold uppercase tracking-[0.24em] text-[#c7b89c]/65">
              est. 2024 / worldwide
            </span>


            <a
              href="#broadcast"
              className="nhb-small-readable border border-[#cdb789]/30 bg-black/40 px-4 py-3 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#e0d1b5]/80 transition-colors hover:bg-[#561b16]/75 hover:text-[#f4e3c3]"
            >
              Watch ↓
            </a>

          </div>

        </div>

      </section>


      {/* ================================================
          THE MAIN EVENT IS THE TV
          ================================================ */}

      <div id="broadcast">
        <BroadcastConsole />
      </div>


      {/* ================================================
          3 LABEL MEMBERS
          ================================================ */}

      <ChannelWindows />


      {/* ================================================
          FOOTER
          ================================================ */}

      <footer className="relative overflow-hidden border-t border-[#a78e65]/15 bg-[#020302] px-4 py-20 md:px-7 md:py-28">

        {/* subtle red glow */}

        <div className="pointer-events-none absolute -bottom-32 right-[-80px] h-[320px] w-[420px] rounded-full bg-[#651d17]/10 blur-[100px]" />


        <div className="relative z-10 mx-auto max-w-7xl">

          <div className="grid gap-16 md:grid-cols-[1fr_auto] md:items-end">

            <div>

              <p className="nhb-small-readable font-mono text-[8px] font-bold uppercase tracking-[0.25em] text-[#c0ae90]/65">
                no.holds barred
              </p>


              <p className="nhb-outline mt-5 font-display text-[14vw] leading-[0.68] tracking-[-0.06em] text-[#a99f8b] md:text-[8vw]">
                Stay
                <br />
                tuned.
              </p>

            </div>


            <div className="md:min-w-[320px]">

              <p className="nhb-small-readable mb-6 font-mono text-[8px] font-bold uppercase tracking-[0.24em] text-[#c1af91]/70">
                Find the signal
              </p>


              <div className="grid grid-cols-2 gap-x-8 gap-y-4">

                <a
                  href="#"
                  className="nhb-small-readable border-b border-[#af966c]/20 pb-2 font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-[#d2c2a7]/78 transition-colors hover:border-[#d3ae6a]/60 hover:text-[#efd7a6]"
                >
                  Instagram ↗
                </a>

                <a
                  href="#"
                  className="nhb-small-readable border-b border-[#af966c]/20 pb-2 font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-[#d2c2a7]/78 transition-colors hover:border-[#d3ae6a]/60 hover:text-[#efd7a6]"
                >
                  YouTube ↗
                </a>

                <a
                  href="#"
                  className="nhb-small-readable border-b border-[#af966c]/20 pb-2 font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-[#d2c2a7]/78 transition-colors hover:border-[#d3ae6a]/60 hover:text-[#efd7a6]"
                >
                  Bandcamp ↗
                </a>

                <a
                  href="#"
                  className="nhb-small-readable border-b border-[#af966c]/20 pb-2 font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-[#d2c2a7]/78 transition-colors hover:border-[#d3ae6a]/60 hover:text-[#efd7a6]"
                >
                  SoundCloud ↗
                </a>

                <a
                  href="#"
                  className="nhb-small-readable border-b border-[#af966c]/20 pb-2 font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-[#d2c2a7]/78 transition-colors hover:border-[#d3ae6a]/60 hover:text-[#efd7a6]"
                >
                  Spotify ↗
                </a>

                <a
                  href="#"
                  className="nhb-small-readable border-b border-[#af966c]/20 pb-2 font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-[#d2c2a7]/78 transition-colors hover:border-[#d3ae6a]/60 hover:text-[#efd7a6]"
                >
                  Apple Music ↗
                </a>

              </div>


              <div className="mt-10 flex items-center justify-between border-t border-[#bca274]/15 pt-5">

                <span className="nhb-small-readable font-mono text-[7px] font-semibold uppercase tracking-[0.18em] text-[#a9987f]/65">
                  independent · worldwide
                </span>


                <Link
                  href="#top"
                  className="nhb-small-readable font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-[#cbb58e]/75 hover:text-[#e3c581]"
                >
                  Top ↑
                </Link>

              </div>

            </div>

          </div>

        </div>

      </footer>

    </main>
  )
}