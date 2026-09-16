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
import { latestRelease } from "@/lib/data"

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
    <main className="night-site">

      {/* =================================================
          HERO
          ================================================= */}

      <section
        ref={heroRef}
        style={heroStyle}
        className="night-hero relative h-[94vh] min-h-[620px] w-full overflow-hidden"
      >

        <div
          className="absolute inset-[-3%] transition-transform duration-700 ease-out"
          style={{
            transform:
              "translate3d(calc(var(--mx) * -10px), calc(var(--my) * -6px), 0) scale(1.05)",
          }}
        >

          <Image
            src="/images/hero.png"
            alt="no.holds barred"
            fill
            priority
            sizes="100vw"
            className="object-cover brightness-[0.48] contrast-[1.12] saturate-[0.7]"
          />

        </div>

        <div className="night-hero-wash" />
        <div className="night-hero-grain" />


        <div className="relative z-10 flex h-full flex-col justify-between px-4 py-7 md:px-7 md:py-9">

          <div className="flex items-start justify-between gap-5">

            <div className="live-chip">
              <span className="live-chip-dot" />
              Live after midnight
            </div>

            <div className="hidden text-right font-mono text-[8px] uppercase tracking-[0.22em] text-[#b5aa96]/50 sm:block">
              NHB / 001
              <br />
              independent transmission
            </div>

          </div>


          <div
            className="transition-transform duration-500 ease-out"
            style={{
              transform:
                "translate3d(calc(var(--mx) * 8px), calc(var(--my) * 4px), 0)",
            }}
          >

            <p className="mb-4 font-mono text-[8px] uppercase tracking-[0.28em] text-[#c5b89f]/45">
              Music · image · noise · people
            </p>


            <h1 className="hero-title promo-display text-[20vw] leading-[0.7] md:text-[14vw]">
              no.holds
              <br />
              barred
            </h1>


            <div className="mt-8 flex flex-col gap-6 border-t border-[#d5bf95]/15 pt-5 md:flex-row md:items-end md:justify-between">

              <p className="max-w-md text-sm leading-relaxed text-[#b8aa93]/65">
                Independent music and creative
                transmissions from somewhere after
                midnight.
              </p>


              <div className="flex items-center gap-4 font-mono text-[8px] uppercase tracking-[0.2em] text-[#d2c29f]/50">

                <span>
                  CH 001
                </span>

                <span className="h-px w-10 bg-[#d2c29f]/25" />

                <span>
                  Scroll to tune in
                </span>

              </div>

            </div>

          </div>


          <div className="flex items-end justify-between">

            <span className="font-mono text-[7px] uppercase tracking-[0.24em] text-[#b4a58e]/35">
              est. 2024 / worldwide
            </span>


            <Link
              href="/artists"
              className="border border-[#c6b188]/25 bg-black/20 px-4 py-3 font-mono text-[8px] uppercase tracking-[0.2em] text-[#d6c7a9]/65 transition-colors hover:bg-[#671c17]/70 hover:text-[#f0dfbf]"
            >
              Enter archive ↗
            </Link>

          </div>

        </div>

      </section>


      {/* =================================================
          BROADCAST CONSOLE
          ================================================= */}

      <div className="broadcast-night">
        <BroadcastConsole />
      </div>


      {/* =================================================
          CHANNEL WINDOWS
          ================================================= */}

      <ChannelWindows />


      {/* =================================================
          MAIN EVENT / RELEASE
          ================================================= */}

      <section className="main-event px-4 py-24 md:px-7 md:py-36">

        <div className="relative z-10 mx-auto max-w-7xl">

          <div className="mb-16">

            <div className="flex flex-wrap items-center gap-4">

              <span className="promo-chip">
                Main event
              </span>

              <span className="event-kicker font-mono text-[8px] font-bold uppercase tracking-[0.24em]">
                latest transmission
              </span>

            </div>


            <h2 className="event-title promo-display mt-6 text-[17vw] leading-[0.67] md:text-[11vw]">
              {latestRelease.title}
            </h2>


            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[8px] uppercase tracking-[0.2em] text-[#9d8b74]/60">

              <span>
                {latestRelease.artistName}
              </span>

              <span>
                {latestRelease.type}
              </span>

              <span>
                {latestRelease.catalog}
              </span>

              <span>
                {latestRelease.tracklist.length} tracks
              </span>

            </div>

          </div>


          <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-20">

            <div>

              <div className="release-frame">

                <div className="relative aspect-square overflow-hidden">

                  <Image
                    src={
                      latestRelease.artwork ||
                      "/placeholder.svg"
                    }
                    alt={`${latestRelease.title} artwork`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="release-art object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-[#6b1c17]/10" />

                  <div className="absolute left-4 top-4 promo-chip">
                    NHB broadcast
                  </div>

                </div>

              </div>


              <div className="mt-8 flex items-center justify-between border-t border-[#d5b678]/15 pt-5">

                <a
                  href={
                    latestRelease
                      .tracklist[0]
                      ?.audioUrl || "#"
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="border border-[#c9a766]/30 bg-[#5e1713]/60 px-5 py-3 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#e3d2b4] transition-colors hover:bg-[#8d281f]"
                >
                  Listen now ↗
                </a>


                <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-[#93836f]/50">
                  playing after midnight
                </span>

              </div>

            </div>


            <div>

              <div className="mb-5 flex items-center justify-between border-b border-[#d4b779]/15 pb-4">

                <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-[#b49d79]/55">
                  Card / tracklist
                </span>

                <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-[#b49d79]/55">
                  {latestRelease.tracklist.length} rounds
                </span>

              </div>


              <div>

                {latestRelease.tracklist.map(
                  (track, index) => (

                    <a
                      key={track.id}
                      href={track.audioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="track-row-night group flex items-center justify-between gap-5 py-5"
                    >

                      <div className="flex min-w-0 items-center gap-5">

                        <span className="font-mono text-[8px] text-[#8d755b]/55">
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </span>

                        <span className="promo-display truncate text-2xl md:text-4xl">
                          {track.title}
                        </span>

                      </div>


                      <span className="font-mono text-[7px] uppercase tracking-[0.16em] text-[#8e795f]/45 group-hover:text-[#d6b274]">
                        Play ↗
                      </span>

                    </a>

                  )
                )}

              </div>


              <div className="mt-9 border border-[#c8a66d]/12 bg-black/20 p-5">

                <p className="max-w-lg text-sm leading-relaxed text-[#aa9980]/60">
                  Current transmission from the
                  no.holds barred archive. Releases,
                  demos, unfinished material and
                  whatever is currently moving through
                  the channel.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          FOOTER
          ================================================= */}

      <footer className="night-footer px-4 py-20 md:px-7 md:py-28">

        <div className="relative z-10 mx-auto max-w-7xl">

          <div className="flex flex-col gap-16 md:flex-row md:items-end md:justify-between">

            <div>

              <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-[#806f5b]/45">
                no.holds barred / nhb 001
              </p>

              <p className="footer-big promo-display mt-5 text-[14vw] leading-[0.68] md:text-[8vw]">
                End
                <br />
                transmission.
              </p>

            </div>


            <div className="space-y-3 text-right font-mono text-[7px] uppercase tracking-[0.2em] text-[#82725e]/45">

              <p>
                music / video / people / archive
              </p>

              <p>
                independent · worldwide
              </p>

              <Link
                href="#"
                className="inline-block border-b border-[#a79070]/25 pb-1 transition-colors hover:text-[#d7b470]"
              >
                Return to signal ↑
              </Link>

            </div>

          </div>

        </div>

      </footer>

    </main>
  )
}