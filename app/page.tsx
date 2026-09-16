"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, type CSSProperties } from "react"

import { BroadcastConsole } from "@/components/music/broadcast-console"
import { affiliates, latestRelease } from "@/lib/data"

export default function HomePage() {
  const heroRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const hero = heroRef.current

    if (!hero) return

    const isReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    const isTouch = window.matchMedia("(pointer: coarse)").matches

    if (isReducedMotion || isTouch) return

    const handleMove = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect()

      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2

      hero.style.setProperty("--mx", x.toString())
      hero.style.setProperty("--my", y.toString())
    }

    const handleLeave = () => {
      hero.style.setProperty("--mx", "0")
      hero.style.setProperty("--my", "0")
    }

    hero.addEventListener("pointermove", handleMove)
    hero.addEventListener("pointerleave", handleLeave)

    return () => {
      hero.removeEventListener("pointermove", handleMove)
      hero.removeEventListener("pointerleave", handleLeave)
    }
  }, [])

  const heroStyle = {
    "--mx": "0",
    "--my": "0",
  } as CSSProperties

  return (
    <main className="bg-paper text-ink">

      {/* HERO */}
      <section
        ref={heroRef}
        style={heroStyle}
        className="relative h-[92vh] min-h-[560px] w-full overflow-hidden bg-ink text-paper"
      >
        <div
          className="absolute inset-[-3%] transition-transform duration-700 ease-out"
          style={{
            transform:
              "translate3d(calc(var(--mx) * -10px), calc(var(--my) * -6px), 0) scale(1.04)",
          }}
        >
          <Image
            src="/images/hero.png"
            alt="no.holds barred"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-70"
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-ink/40" />

        <div className="relative z-10 flex h-full flex-col justify-between px-4 py-8 md:px-6">
          <div className="flex items-start justify-between eyebrow text-paper/80">
            <span>Est. 2024</span>

            <span className="hidden sm:block">
              Independent · Worldwide
            </span>

            <span>Vol. 01</span>
          </div>

          <div
            className="transition-transform duration-500 ease-out"
            style={{
              transform:
                "translate3d(calc(var(--mx) * 8px), calc(var(--my) * 4px), 0)",
            }}
          >
            <div className="relative">
              <p className="mb-3 eyebrow text-paper/60">
                Independent music / art / culture
              </p>

              <h1 className="font-display text-[18vw] leading-[0.78] tracking-[-0.06em] md:text-[13vw]">
                no.holds
                <br />
                .barred
              </h1>
            </div>

            <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
              <p className="font-display text-xl uppercase tracking-tight md:text-3xl">
                Music / Art / Culture
              </p>

              <p className="max-w-sm text-sm leading-relaxed text-paper/70">
                An independent music label and multidisciplinary creative
                collective. A scene, not a catalogue.
              </p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-6 eyebrow text-paper/70">
            <div className="flex items-center gap-4">
              <span>Scroll</span>

              <span
                aria-hidden="true"
                className="h-px w-16 bg-paper/40"
              />

              <span>Transmission in progress</span>
            </div>

            <Link
              href="/artists"
              className="group hidden items-center gap-3 border border-paper/40 px-4 py-3 text-paper transition-colors duration-300 hover:bg-paper hover:text-ink sm:flex"
            >
              <span>Enter archive</span>

              <span className="transition-transform duration-300 group-hover:translate-x-1">
                ↗
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* BROADCAST CONSOLE */}
      <BroadcastConsole />

      {/* AFFILIATES */}
      <section className="relative overflow-hidden border-t border-ink/15 px-4 py-20 md:px-6 md:py-32">
        <div className="mb-12 flex items-end justify-between gap-6 md:mb-16">
          <div>
            <p className="eyebrow text-muted-ink">
              Artists We&apos;re Listening To
            </p>

            <h2 className="mt-3 font-display text-[15vw] leading-[0.75] tracking-[-0.05em] uppercase md:text-[11vw]">
              Affiliates
            </h2>
          </div>

          <Link
            href="/affiliates"
            className="eyebrow hidden border-b border-ink/40 pb-1 transition-opacity hover:opacity-50 sm:block"
          >
            View archive ↗
          </Link>
        </div>

        <div className="relative">
          {affiliates.slice(0, 4).map((artist, index) => (
            <Link
              key={artist.slug}
              href={`/artists/${artist.slug}`}
              className={`group relative block overflow-hidden border-t border-ink/20 py-7 md:py-10 ${
                index % 2 === 1 ? "md:pl-[12vw]" : ""
              }`}
            >
              <div className="pointer-events-none absolute inset-y-0 right-[8%] hidden w-[220px] overflow-hidden opacity-0 transition-all duration-500 ease-out group-hover:opacity-70 md:block">
                <Image
                  src={artist.hero || "/placeholder.svg"}
                  alt=""
                  fill
                  sizes="220px"
                  className="object-cover grayscale transition-transform duration-700 ease-out group-hover:scale-110"
                />
              </div>

              <div className="relative z-10 flex items-center justify-between gap-6">
                <div className="flex items-baseline gap-4 md:gap-8">
                  <span className="eyebrow text-muted-ink">
                    0{index + 1}
                  </span>

                  <h3 className="font-display text-[10vw] leading-[0.8] tracking-[-0.04em] uppercase transition-transform duration-500 group-hover:translate-x-3 md:text-[7vw]">
                    {artist.name}
                  </h3>
                </div>

                <span className="hidden text-sm text-muted-ink transition-transform duration-500 group-hover:translate-x-2 md:block">
                  ↗
                </span>
              </div>

              <div className="relative z-10 mt-3 flex items-center gap-3 pl-8 text-xs uppercase tracking-[0.12em] text-muted-ink md:pl-16">
                <span>{artist.role}</span>
                <span>·</span>
                <span>{artist.location}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 sm:hidden">
          <Link
            href="/affiliates"
            className="eyebrow border-b border-ink/40 pb-1"
          >
            View archive ↗
          </Link>
        </div>
      </section>

      {/* LATEST RELEASE */}
      <section className="relative overflow-hidden bg-ink px-4 py-20 text-paper md:px-6 md:py-32">
        <div className="mb-16 flex items-start justify-between gap-6 md:mb-24">
          <div>
            <p className="eyebrow mb-3 text-paper/50">
              Latest transmission
            </p>

            <h2 className="font-display text-[12vw] leading-[0.78] tracking-[-0.05em] uppercase md:text-[9vw]">
              {latestRelease.title}
            </h2>
          </div>

          <Link
            href={`/releases/${latestRelease.slug}`}
            className="eyebrow link-underline shrink-0 pt-2"
          >
            Open release ↗
          </Link>
        </div>

        <div className="relative grid gap-12 md:grid-cols-[1.15fr_0.85fr] md:items-end md:gap-20">
          <div className="relative">
            <div className="group relative aspect-square max-w-2xl overflow-hidden bg-paper/10">
              <Image
                src={latestRelease.artwork || "/placeholder.svg"}
                alt={`${latestRelease.title} artwork`}
                fill
                sizes="(max-width: 768px) 100vw, 65vw"
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.04]"
              />

              <div className="absolute inset-0 bg-ink/10 transition-opacity duration-500 group-hover:bg-transparent" />

              <div className="absolute bottom-5 left-5 eyebrow text-paper/70">
                {latestRelease.catalog}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-5 border-t border-paper/20 pt-5">
              <a
                href={latestRelease.tracklist[0]?.audioUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center border border-paper px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.15em] transition-colors duration-300 hover:bg-paper hover:text-ink"
              >
                Listen ↗
              </a>

              <div className="eyebrow text-paper/50">
                {latestRelease.artistName} · {latestRelease.type}
              </div>
            </div>
          </div>

          <div className="relative md:pb-2">
            <div className="mb-6 flex items-center justify-between border-b border-paper/20 pb-3">
              <span className="eyebrow text-paper/50">
                Tracklist
              </span>

              <span className="eyebrow text-paper/50">
                {latestRelease.tracklist.length} tracks
              </span>
            </div>

            <div className="divide-y divide-paper/20">
              {latestRelease.tracklist.map((track, index) => (
                <a
                  key={track.id}
                  href={track.audioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between gap-4 py-4 transition-transform duration-300 hover:translate-x-2"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="font-mono text-[9px] text-paper/30">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="truncate font-display text-xl uppercase md:text-2xl">
                      {track.title}
                    </span>
                  </div>

                  <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.15em] text-paper/30 transition-colors group-hover:text-paper">
                    Play ↗
                  </span>
                </a>
              ))}
            </div>

            <div className="mt-10 border-t border-paper/20 pt-5">
              <p className="max-w-md text-sm leading-relaxed text-paper/50">
                The latest release from no.holds barred.
                Listen, explore the credits, and enter the archive.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-ink/15 px-4 py-16 md:px-6 md:py-24">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow text-muted-ink">
              no.holds barred
            </p>

            <p className="mt-4 font-display text-5xl uppercase tracking-[-0.04em] md:text-8xl">
              End transmission.
            </p>
          </div>

          <div className="eyebrow text-muted-ink">
            Independent · Worldwide · Est. 2024
          </div>
        </div>
      </footer>

    </main>
  )
}