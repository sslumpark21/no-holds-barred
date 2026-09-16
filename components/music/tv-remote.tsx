"use client"

import { useState } from "react"
import Link from "next/link"
import { latestRelease } from "@/lib/data"

export function TvRemote() {
  const [channel, setChannel] = useState(1)
  const [selected, setSelected] = useState("MUSIC")

  const destinations = ["MUSIC", "VIDEO", "ARCHIVE", "INFO"]

  const moveSelection = (direction: number) => {
    const current = destinations.indexOf(selected)
    const next =
      (current + direction + destinations.length) %
      destinations.length

    setSelected(destinations[next])
  }

  const moveChannel = (direction: number) => {
    setChannel((current) => {
      const next = current + direction

      if (next < 1) return 4
      if (next > 4) return 1

      return next
    })
  }

  return (
    <section className="relative min-h-[100vh] overflow-hidden bg-[#d5d2cb] px-4 py-10 text-black md:px-6">

      {/* =====================================================
          BACKGROUND
          ===================================================== */}

      <div className="pointer-events-none absolute inset-0">

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(255,255,255,0.75),transparent_42%)]" />

        <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.025)_0px,rgba(0,0,0,0.025)_1px,transparent_1px,transparent_5px)]" />

      </div>


      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="relative z-10 flex justify-between font-mono text-[8px] uppercase tracking-[0.25em] text-black/40">

        <span>
          NO.HOLDS BARRED
        </span>

        <span>
          REMOTE 001
        </span>

      </div>


      {/* =====================================================
          REMOTE AREA
          ===================================================== */}

      <div className="relative z-10 mx-auto flex min-h-[86vh] max-w-5xl items-center justify-center">

        {/* Shadow */}

        <div className="absolute bottom-[7%] left-1/2 h-16 w-[290px] -translate-x-1/2 rounded-full bg-black/30 blur-2xl" />


        {/* =================================================
            REMOTE
            ================================================= */}

        <div className="relative w-[285px] rotate-[-4deg] transition-transform duration-700 hover:rotate-[-2deg] md:w-[325px]">

          <div className="relative rounded-[36px] border-2 border-[#090909] bg-[#202020] px-5 pb-7 pt-5 shadow-[18px_25px_0_rgba(0,0,0,0.18),28px_40px_55px_rgba(0,0,0,0.32)]">

            {/* Plastic seam */}

            <div className="pointer-events-none absolute inset-[6px] rounded-[30px] border border-white/[0.08]" />

            {/* Plastic reflection */}

            <div className="pointer-events-none absolute left-10 right-10 top-2 h-[2px] rounded-full bg-white/[0.08]" />


            {/* =============================================
                BRAND
                ============================================= */}

            <div className="relative mb-5 flex items-end justify-between px-2 pt-2">

              <div>

                <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/75">
                  no.holds
                </div>

                <div className="mt-1 font-mono text-[6px] uppercase tracking-[0.2em] text-white/30">
                  broadcast controller
                </div>

              </div>

              <span className="font-mono text-[6px] text-white/25">
                NHB-01
              </span>

            </div>


            {/* =============================================
                LCD
                ============================================= */}

            <div className="rounded-[11px] border border-black bg-[#080808] p-2 shadow-[inset_0_3px_8px_rgba(0,0,0,0.8)]">

              <div className="rounded-[4px] border border-white/10 bg-[#111] px-3 py-3">

                <div className="flex items-center justify-between font-mono text-[7px] uppercase tracking-[0.15em] text-white/30">

                  <span>
                    CHANNEL
                  </span>

                  <span>
                    SELECT
                  </span>

                </div>

                <div className="mt-2 flex items-end justify-between">

                  <span className="font-mono text-[34px] leading-none text-white/85">
                    {String(channel).padStart(2, "0")}
                  </span>

                  <span className="font-mono text-[11px] uppercase text-white/55">
                    {selected}
                  </span>

                </div>

              </div>

            </div>


            {/* =============================================
                HOME / POWER
                ============================================= */}

            <div className="mt-5 grid grid-cols-2 gap-2">

              <Link
                href="/"
                className="remote-black-button flex items-center justify-center"
              >
                HOME
              </Link>

              <button
                type="button"
                className="remote-black-button"
              >
                POWER
              </button>

            </div>


            {/* =============================================
                CHANNEL
                ============================================= */}

            <div className="mt-5 rounded-[14px] border border-white/[0.08] bg-[#292929] p-3 shadow-[inset_0_3px_6px_rgba(0,0,0,0.45)]">

              <div className="mb-2 text-center font-mono text-[7px] uppercase tracking-[0.2em] text-white/30">
                CHANNEL
              </div>

              <div className="grid grid-cols-2 gap-2">

                <button
                  type="button"
                  onClick={() => moveChannel(-1)}
                  className="remote-direction-button"
                  aria-label="Previous channel"
                >
                  ▲
                </button>

                <button
                  type="button"
                  onClick={() => moveChannel(1)}
                  className="remote-direction-button"
                  aria-label="Next channel"
                >
                  ▼
                </button>

              </div>

            </div>


            {/* =============================================
                NAVIGATION DIAL
                ============================================= */}

            <div className="mt-5 flex justify-center">

              <div className="relative h-[125px] w-[125px] rounded-full border-2 border-black bg-[#111] shadow-[inset_0_5px_10px_rgba(0,0,0,0.8),0_2px_3px_rgba(255,255,255,0.08)]">

                <button
                  type="button"
                  onClick={() => moveSelection(-1)}
                  className="absolute left-1/2 top-3 -translate-x-1/2 font-mono text-[13px] text-white/50 transition-colors hover:text-white"
                  aria-label="Previous selection"
                >
                  ▲
                </button>

                <button
                  type="button"
                  onClick={() => moveSelection(1)}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[13px] text-white/50 transition-colors hover:text-white"
                  aria-label="Next selection"
                >
                  ▼
                </button>

                <button
                  type="button"
                  onClick={() => moveSelection(-1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-white/50 transition-colors hover:text-white"
                  aria-label="Previous selection"
                >
                  ◀
                </button>

                <button
                  type="button"
                  onClick={() => moveSelection(1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-white/50 transition-colors hover:text-white"
                  aria-label="Next selection"
                >
                  ▶
                </button>


                {/* OK */}

                <button
                  type="button"
                  className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black bg-[#292929] shadow-[inset_0_3px_5px_rgba(255,255,255,0.08),0_2px_3px_rgba(0,0,0,0.5)]"
                >

                  <span className="font-mono text-[9px] font-bold tracking-[0.15em] text-white/60">
                    OK
                  </span>

                </button>

              </div>

            </div>


            {/* =============================================
                DESTINATIONS
                ============================================= */}

            <div className="mt-5">

              <div className="mb-2 px-1 font-mono text-[7px] uppercase tracking-[0.2em] text-white/25">
                Destination
              </div>

              <div className="grid grid-cols-4 gap-2">

                {destinations.map((item) => (

                  <button
                    key={item}
                    type="button"
                    onClick={() => setSelected(item)}
                    className={`remote-destination-button ${
                      selected === item
                        ? "remote-destination-active"
                        : ""
                    }`}
                  >
                    {item}
                  </button>

                ))}

              </div>

            </div>


            {/* =============================================
                BOTTOM LABEL
                ============================================= */}

            <div className="mt-5 flex justify-between border-t border-white/[0.08] pt-3 font-mono text-[6px] uppercase tracking-[0.15em] text-white/20">

              <span>
                Use responsibly
              </span>

              <span>
                Do not lose
              </span>

            </div>

          </div>

        </div>


        {/* =================================================
            CURRENT SELECTION
            ================================================= */}

        <div className="absolute bottom-[1%] left-1/2 w-full -translate-x-1/2 text-center">

          <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-black/35">
            Channel {String(channel).padStart(2, "0")}
          </p>

          <p className="mt-2 font-display text-[9vw] leading-[0.78] tracking-[-0.06em] uppercase md:text-[5vw]">
            {selected}
          </p>

          <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.2em] text-black/35">
            {latestRelease.artistName}
          </p>

        </div>

      </div>


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <div className="relative z-10 flex justify-between font-mono text-[8px] uppercase tracking-[0.25em] text-black/30">

        <span>
          Remote 001
        </span>

        <span>
          Scroll to continue
        </span>

      </div>

    </section>
  )
}