"use client"

import Image from "next/image"

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
              1px rgba(3, 4, 3, 0.95);

            text-shadow:
              -2px -2px 0 rgba(0,0,0,.8),
              2px -2px 0 rgba(0,0,0,.8),
              -2px 2px 0 rgba(0,0,0,.8),
              2px 2px 0 rgba(0,0,0,.8),
              0 8px 22px rgba(0,0,0,.9);
          }

          .nhb-small-readable {
            text-shadow:
              0 1px 2px rgba(0,0,0,1),
              0 0 8px rgba(0,0,0,.85);
          }

          @keyframes nhbRoomGlow {
            0%, 100% {
              opacity: .48;
            }

            50% {
              opacity: .72;
            }
          }

          .nhb-room-glow {
            animation:
              nhbRoomGlow
              7s
              ease-in-out
              infinite;
          }

        `}
      </style>

      {/* STEEL CAGE HERO */}

      <section
        ref={heroRef}
        style={heroStyle}
        className="relative h-[76vh] min-h-[560px] overflow-hidden border-b border-[#d5bb8a]/10 bg-[#040504]"
      >

        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(
                circle at 72% 35%,
                rgba(126, 148, 91, .20),
                transparent 31%
              ),
              radial-gradient(
                circle at 24% 72%,
                rgba(109, 38, 28, .20),
                transparent 38%
              ),
              linear-gradient(
                135deg,
                #11120d 0%,
                #070806 48%,
                #020302 100%
              )
            `,
          }}
        />

        <div
          className="nhb-room-glow pointer-events-none absolute left-[35%] top-[4%] h-[72%] w-[70%] rounded-full blur-[120px]"
          style={{
            background:
              "rgba(149, 171, 103, .13)",
          }}
        />

        <div
          className="pointer-events-none"
          style={{
            position: "absolute",
            inset: "-14px",
            transform:
              "translate3d(calc(var(--mx) * -10px), calc(var(--my) * -6px), 0)",
          }}
        >
          <Image
            src="/images/hero-cage.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,0,.32)_60%,rgba(0,0,0,.88)_100%)]" />

        <div
          className="pointer-events-none absolute bottom-0 left-0 h-[65%] w-[78%]"
          style={{
            background:
              "radial-gradient(ellipse at 25% 80%, rgba(0,0,0,.64), transparent 67%)",
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-between px-4 py-7 md:px-7 md:py-9">

          <div className="h-[34px]" aria-hidden="true" />

          <div
            className="transition-transform duration-500 ease-out"
            style={{
              transform:
                "translate3d(calc(var(--mx) * 7px), calc(var(--my) * 3px), 0)",
            }}
          >
            <h1 className="nhb-outline font-display text-[19vw] leading-[0.7] tracking-[-0.06em] text-[#ddd0b7] md:text-[13vw]">
              no.holds.
              <br />
              barred.
            </h1>
          </div>

          <div className="flex justify-end">

            <a
              href="#broadcast"
              className="nhb-small-readable border border-[#dec393]/35 bg-black/60 px-4 py-3 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#ead7b7]/90 transition-colors hover:bg-[#641d17]/80 hover:text-[#f4e3c3]"
            >
              Watch ↓
            </a>

          </div>

        </div>

      </section>

      {/* TV */}

      <div id="broadcast">
        <BroadcastConsole />
      </div>

      {/* LABEL MEMBERS */}

      <ChannelWindows />

      {/* FOOTER */}

      <footer className="relative overflow-hidden border-t border-[#a78e65]/15 bg-[#020302] px-4 py-20 md:px-7 md:py-28">

        <div className="pointer-events-none absolute -bottom-32 right-[-80px] h-[320px] w-[420px] rounded-full bg-[#651d17]/10 blur-[100px]" />

        <div className="relative z-10 mx-auto max-w-7xl">

          <div className="grid gap-16 md:grid-cols-[1fr_auto] md:items-end">

            <div>

              <p className="nhb-small-readable font-mono text-[8px] font-bold uppercase tracking-[0.25em] text-[#c0ae90]/75">
                no.holds.barred.
              </p>

              <p className="nhb-outline mt-5 font-display text-[14vw] leading-[0.68] tracking-[-0.06em] text-[#a99f8b] md:text-[8vw]">
                Stay
                <br />
                tuned.
              </p>

            </div>

            <div className="md:min-w-[320px]">
              <p className="nhb-small-readable mb-6 font-mono text-[8px] font-bold uppercase tracking-[0.24em] text-[#c1af91]/80">
                CONTACT
              </p>
              <a
                href="mailto:sslum.park@gmail.com"
                className="nhb-small-readable border-b border-[#af966c]/25 pb-2 font-mono text-[9px] font-bold tracking-[0.17em] text-[#d8c7ab]/85 transition-colors hover:border-[#d3ae6a]/60 hover:text-[#efd7a6]"
              >
                sslum.park@gmail.com
              </a>
              <p className="nhb-small-readable mt-6 font-mono text-[9px] tracking-[0.17em] text-[#d8c7ab]/85">
                Business and breesh.
              </p>
            </div>

          </div>

        </div>

      </footer>

    </main>
  )
}
