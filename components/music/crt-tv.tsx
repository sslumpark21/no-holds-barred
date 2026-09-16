"use client"

import { useState } from "react"
import Image from "next/image"
import { latestRelease } from "@/lib/data"

type CrtTvProps = {
  youtubeId?: string
  channel?: number
  artistName?: string
  videoTitle?: string
}

export function CrtTv({
  youtubeId,
  channel = 1,
  artistName = latestRelease.artistName,
  videoTitle = "CURRENT TRANSMISSION",
}: CrtTvProps) {
  const [powered, setPowered] = useState(true)
  const [currentChannel, setCurrentChannel] = useState(channel)

  const previousChannel = () => {
    setCurrentChannel((current) => (current <= 1 ? 9 : current - 1))
  }

  const nextChannel = () => {
    setCurrentChannel((current) => (current >= 9 ? 1 : current + 1))
  }

  return (
    <section className="relative overflow-hidden bg-[#111] px-4 py-20 text-white md:px-6 md:py-32">

      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[40%] h-[520px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.035] blur-[100px]" />
      </div>

      {/* Section heading */}
      <div className="relative z-10 mx-auto mb-16 flex max-w-7xl items-end justify-between gap-8">

        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-white/35">
            NHB Television Network
          </p>

          <h2 className="mt-3 font-display text-[15vw] leading-[0.72] tracking-[-0.06em] uppercase md:text-[10vw]">
            Video
          </h2>
        </div>

        <div className="hidden text-right font-mono text-[8px] uppercase tracking-[0.2em] text-white/30 md:block">
          <p>Channel {String(currentChannel).padStart(2, "0")}</p>
          <p className="mt-1">{artistName}</p>
        </div>

      </div>

      {/* Television */}
      <div className="relative z-10 mx-auto max-w-[980px]">

        {/* TV shadow */}
        <div className="absolute -bottom-10 left-[8%] right-[8%] h-20 rounded-[50%] bg-black/80 blur-3xl" />

        {/* TV BODY */}
        <div className="relative rounded-[34px] border-[3px] border-black bg-[#252525] p-4 shadow-[0_40px_80px_rgba(0,0,0,0.7)] md:rounded-[46px] md:p-7">

          {/* Plastic highlight */}
          <div className="pointer-events-none absolute left-12 right-12 top-2 h-[2px] rounded-full bg-white/[0.07]" />

          {/* Molded seam */}
          <div className="pointer-events-none absolute inset-[7px] rounded-[28px] border border-white/[0.04] md:rounded-[40px]" />

          {/* Brand plate */}
          <div className="mb-4 flex items-center justify-between px-2 md:mb-6">

            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-white/55">
                no.holds
              </p>

              <p className="mt-1 font-mono text-[5px] uppercase tracking-[0.2em] text-white/20">
                television receiver
              </p>
            </div>

            <div className="font-mono text-[6px] uppercase tracking-[0.2em] text-white/20">
              NHB-TV / 199X
            </div>

          </div>

          {/* Main TV layout */}
          <div className="grid gap-4 md:grid-cols-[1fr_150px] md:gap-6">

            {/* SCREEN */}
            <div className="relative">

              {/* Bezel */}
              <div className="relative overflow-hidden rounded-[28px] border-[10px] border-[#151515] bg-black shadow-[inset_0_0_30px_rgba(0,0,0,0.9)] md:rounded-[40px] md:border-[15px]">

                {/* Curved screen */}
                <div className="crt-screen relative aspect-[4/3] overflow-hidden bg-[#080808]">

                  {powered ? (
                    <>
                      {youtubeId ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                          title={videoTitle}
                          className="absolute inset-0 h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : (
                        <>
                          <Image
                            src={latestRelease.artwork || "/placeholder.svg"}
                            alt={artistName}
                            fill
                            sizes="900px"
                            className="object-cover opacity-60 grayscale"
                          />

                          {/* NO SIGNAL texture */}
                          <div className="absolute inset-0 bg-black/25" />

                          <div className="crt-noise absolute inset-0 opacity-20" />

                          <div className="absolute inset-0 flex items-center justify-center">

                            <div className="text-center">

                              <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/40">
                                Signal waiting
                              </p>

                              <p className="mt-3 font-display text-4xl uppercase tracking-[-0.05em] text-white/80 md:text-7xl">
                                No Signal
                              </p>

                              <p className="mt-4 font-mono text-[7px] uppercase tracking-[0.2em] text-white/30">
                                Add YouTube transmission
                              </p>

                            </div>

                          </div>
                        </>
                      )}

                      {/* Channel display */}
                      <div className="pointer-events-none absolute left-4 top-4 z-20 font-mono text-[9px] uppercase tracking-[0.2em] text-white/80 drop-shadow-md md:left-6 md:top-6">
                        CH {String(currentChannel).padStart(2, "0")}
                      </div>

                      {/* REC marker */}
                      <div className="pointer-events-none absolute right-4 top-4 z-20 flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.2em] text-white/60 md:right-6 md:top-6">

                        <span className="h-2 w-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(255,0,0,0.75)]" />

                        ARCHIVE
                      </div>

                      {/* Artist label */}
                      <div className="pointer-events-none absolute bottom-5 left-5 z-20 md:bottom-7 md:left-7">

                        <p className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/50">
                          Current transmission
                        </p>

                        <p className="mt-1 font-display text-xl uppercase tracking-[-0.03em] text-white md:text-3xl">
                          {artistName}
                        </p>

                      </div>

                      {/* Scanlines */}
                      <div className="crt-scanlines pointer-events-none absolute inset-0 z-30" />

                      {/* Glass */}
                      <div className="pointer-events-none absolute inset-0 z-30 bg-[linear-gradient(115deg,rgba(255,255,255,0.12)_0%,transparent_18%,transparent_72%,rgba(255,255,255,0.04)_100%)]" />

                      {/* CRT vignette */}
                      <div className="pointer-events-none absolute inset-0 z-30 shadow-[inset_0_0_70px_rgba(0,0,0,0.85)]" />

                    </>
                  ) : (
                    <div className="absolute inset-0 bg-black" />
                  )}

                </div>

              </div>

              {/* Screen underside */}
              <div className="mx-auto mt-2 h-[3px] w-[80%] rounded-full bg-black/60" />

            </div>

            {/* TV CONTROL PANEL */}
            <div className="flex flex-row gap-4 rounded-[20px] border border-white/[0.04] bg-[#1d1d1d] p-4 shadow-[inset_0_3px_8px_rgba(0,0,0,0.65)] md:flex-col">

              {/* Power */}
              <div className="flex flex-1 flex-col items-center">

                <button
                  type="button"
                  onClick={() => setPowered((value) => !value)}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border border-black text-sm shadow-[inset_0_2px_3px_rgba(255,255,255,0.07),0_3px_4px_rgba(0,0,0,0.6)] transition-all active:translate-y-[2px] ${
                    powered
                      ? "bg-[#8d1a16] text-white/80"
                      : "bg-[#333] text-white/30"
                  }`}
                  aria-label="Power"
                >
                  ⏻
                </button>

                <span className="mt-2 font-mono text-[6px] uppercase tracking-[0.18em] text-white/25">
                  Power
                </span>

              </div>

              {/* Channel display */}
              <div className="flex flex-1 flex-col items-center">

                <div className="flex h-14 w-full items-center justify-center rounded-[5px] border border-black bg-[#101010] font-mono text-2xl text-[#8f987c] shadow-[inset_0_3px_6px_rgba(0,0,0,0.9)]">
                  {String(currentChannel).padStart(2, "0")}
                </div>

                <span className="mt-2 font-mono text-[6px] uppercase tracking-[0.18em] text-white/25">
                  Channel
                </span>

              </div>

              {/* Channel controls */}
              <div className="flex flex-1 gap-2 md:flex-col">

                <button
                  type="button"
                  onClick={previousChannel}
                  className="flex min-h-12 flex-1 items-center justify-center rounded-[8px] border border-black bg-[#292929] text-white/45 shadow-[inset_0_2px_3px_rgba(255,255,255,0.05),0_3px_3px_rgba(0,0,0,0.6)] transition-colors hover:bg-[#333] hover:text-white"
                >
                  ▲
                </button>

                <button
                  type="button"
                  onClick={nextChannel}
                  className="flex min-h-12 flex-1 items-center justify-center rounded-[8px] border border-black bg-[#292929] text-white/45 shadow-[inset_0_2px_3px_rgba(255,255,255,0.05),0_3px_3px_rgba(0,0,0,0.6)] transition-colors hover:bg-[#333] hover:text-white"
                >
                  ▼
                </button>

              </div>

              {/* Speaker */}
              <div className="hidden md:block">

                <p className="mb-3 text-center font-mono text-[6px] uppercase tracking-[0.18em] text-white/20">
                  Speaker
                </p>

                <div className="grid grid-cols-6 gap-[5px]">

                  {Array.from({ length: 48 }).map((_, index) => (
                    <span
                      key={index}
                      className="h-[4px] w-[4px] rounded-full bg-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                    />
                  ))}

                </div>

              </div>

              {/* Status */}
              <div className="hidden border-t border-white/[0.05] pt-4 text-center md:block">

                <div className="flex items-center justify-center gap-2">

                  <span
                    className={`h-2 w-2 rounded-full ${
                      powered
                        ? "bg-green-700 shadow-[0_0_6px_rgba(0,150,0,0.6)]"
                        : "bg-black"
                    }`}
                  />

                  <span className="font-mono text-[6px] uppercase tracking-[0.18em] text-white/20">
                    {powered ? "Signal" : "Standby"}
                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* Bottom casing */}
          <div className="mt-5 flex items-center justify-between border-t border-white/[0.05] px-2 pt-4">

            <p className="font-mono text-[6px] uppercase tracking-[0.2em] text-white/20">
              Solid state television
            </p>

            <p className="font-mono text-[6px] uppercase tracking-[0.2em] text-white/20">
              220V · 50Hz
            </p>

          </div>

        </div>

      </div>

      {/* Description */}
      <div className="relative z-10 mx-auto mt-16 flex max-w-7xl flex-col gap-4 border-t border-white/10 pt-5 md:flex-row md:items-center md:justify-between">

        <p className="font-mono text-[7px] uppercase tracking-[0.23em] text-white/30">
          Current video transmission
        </p>

        <p className="font-display text-xl uppercase tracking-[-0.03em] md:text-3xl">
          {videoTitle}
        </p>

        <p className="font-mono text-[7px] uppercase tracking-[0.23em] text-white/30">
          {artistName}
        </p>

      </div>

    </section>
  )
}