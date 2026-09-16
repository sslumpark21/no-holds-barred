"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, type CSSProperties } from "react"

export function Hero() {
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
    <section
      ref={heroRef}
      style={heroStyle}
      className="relative h-[92vh] min-h-[560px] w-full overflow-hidden bg-ink text-paper"
    >
      {/* Background image */}
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

      {/* Dark editorial overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-ink/40" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between px-4 py-8 md:px-6">
        {/* Top metadata */}
        <div className="flex items-start justify-between eyebrow text-paper/80">
          <span>Est. 2024</span>

          <span className="hidden sm:block">
            Independent · Worldwide
          </span>

          <span>Vol. 01</span>
        </div>

        {/* Main identity */}
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

            <h1 className="font-display display-huge text-[18vw] leading-[0.78] tracking-[-0.06em] md:text-[13vw]">
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

        {/* Bottom navigation */}
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
  )
}