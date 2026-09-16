"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { affiliates } from "@/lib/data"

const windowLayouts = [
  "md:col-span-7 md:h-[430px]",
  "md:col-span-5 md:h-[330px] md:mt-24",
  "md:col-span-5 md:h-[340px]",
  "md:col-span-7 md:h-[440px] md:-mt-10",
]

const channelLight = [
  {
    room: "rgba(218, 173, 90, 0.28)",
    spill: "rgba(207, 139, 66, 0.18)",
  },
  {
    room: "rgba(171, 193, 111, 0.25)",
    spill: "rgba(116, 145, 83, 0.16)",
  },
  {
    room: "rgba(104, 134, 162, 0.24)",
    spill: "rgba(58, 81, 111, 0.17)",
  },
  {
    room: "rgba(166, 70, 52, 0.26)",
    spill: "rgba(125, 40, 31, 0.18)",
  },
]

export function ChannelWindows() {
  const [activeChannel, setActiveChannel] =
    useState<number | null>(null)

  const activeLight =
    activeChannel !== null
      ? channelLight[
          activeChannel % channelLight.length
        ]
      : null

  return (
    <section className="relative isolate overflow-hidden bg-[#030403] px-4 py-28 text-[#d1c5ad] md:px-7 md:py-40">

      <style>
        {`
          @keyframes nhbWindowFlicker {
            0%, 7%, 10%, 38%, 41%, 67%, 70%, 100% {
              opacity: .55;
            }

            8% {
              opacity: .38;
            }

            9% {
              opacity: .7;
            }

            39% {
              opacity: .42;
            }

            40% {
              opacity: .66;
            }

            68% {
              opacity: .46;
            }

            69% {
              opacity: .72;
            }
          }

          @keyframes nhbWindowNoise {
            0% {
              transform: translateY(0);
            }

            33% {
              transform: translateY(-1px);
            }

            66% {
              transform: translateY(1px);
            }

            100% {
              transform: translateY(0);
            }
          }

          .nhb-window-flicker {
            animation:
              nhbWindowFlicker
              9s
              steps(1, end)
              infinite;
          }

          .nhb-window-noise {
            animation:
              nhbWindowNoise
              .3s
              steps(2, end)
              infinite;
          }
        `}
      </style>


      {/* active room light */}

      <div
        className="pointer-events-none absolute inset-0 transition-all duration-700"
        style={{
          opacity:
            activeChannel !== null ? 1 : 0,

          background:
            activeLight
              ? `
                radial-gradient(
                  circle at 50% 48%,
                  ${activeLight.spill},
                  transparent 38%
                )
              `
              : "transparent",
        }}
      />


      {/* dark building wall */}

      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: `
            linear-gradient(
              180deg,
              rgba(20,22,17,.25),
              rgba(4,5,3,.85)
            ),
            repeating-linear-gradient(
              90deg,
              rgba(255,255,255,.017) 0px,
              rgba(255,255,255,.017) 1px,
              transparent 1px,
              transparent 150px
            ),
            repeating-linear-gradient(
              0deg,
              rgba(255,255,255,.012) 0px,
              rgba(255,255,255,.012) 1px,
              transparent 1px,
              transparent 110px
            )
          `,
        }}
      />


      {/* vignette */}

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_22%,rgba(0,0,0,.42)_68%,rgba(0,0,0,.88)_100%)]" />


      <div className="relative z-10 mx-auto max-w-7xl">

        {/* heading */}

        <div className="mb-20 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">

          <div>

            <div className="flex items-center gap-4">

              <span className="h-1.5 w-1.5 rounded-full bg-[#9c2920] shadow-[0_0_9px_rgba(169,48,38,.55)]" />

              <p className="font-mono text-[8px] uppercase tracking-[0.28em] text-[#938a77]/45">
                Channel directory / after hours
              </p>

            </div>


            <h2 className="mt-5 font-display text-[17vw] leading-[0.68] tracking-[-0.06em] text-[#a8a08e] md:text-[10vw]">
              Windows.
            </h2>

          </div>


          <div className="max-w-xs font-mono text-[8px] uppercase leading-[1.8] tracking-[0.18em] text-[#776f61]/45">
            Somewhere else,
            <br />
            somebody is still awake.
            <br />
            Tune into their signal.
          </div>

        </div>


        {/* window wall */}

        <div className="relative border border-[#211d18] bg-[#080806] p-3 shadow-[0_40px_100px_rgba(0,0,0,.75)] md:p-5">

          <div className="absolute -top-3 left-[-8px] right-[-8px] h-3 border border-[#191611] bg-[#0e0c09]" />


          <div className="grid gap-5 md:grid-cols-12 md:gap-8">

            {affiliates
              .slice(0, 4)
              .map((artist, index) => {

                const light =
                  channelLight[
                    index %
                      channelLight.length
                  ]

                return (
                  <Link
                    key={artist.slug}
                    href={`/artists/${artist.slug}`}
                    onMouseEnter={() =>
                      setActiveChannel(index)
                    }
                    onMouseLeave={() =>
                      setActiveChannel(null)
                    }
                    className={`
                      group
                      relative
                      block
                      h-[320px]
                      overflow-visible
                      ${windowLayouts[index]}
                    `}
                  >

                    {/* glow around window */}

                    <div
                      className="pointer-events-none absolute -inset-7 rounded-[35%] opacity-0 blur-[45px] transition-opacity duration-700 group-hover:opacity-100"
                      style={{
                        background: light.spill,
                      }}
                    />


                    {/* outer frame */}

                    <div className="absolute inset-0 border-[8px] border-[#15120f] bg-[#040403] shadow-[0_20px_35px_rgba(0,0,0,.65),inset_0_0_0_1px_rgba(255,255,255,.025)]">

                      {/* inner frame */}

                      <div className="absolute inset-[7px] overflow-hidden border border-[#322b21] bg-black">

                        <Image
                          src={
                            artist.hero ||
                            "/placeholder.svg"
                          }
                          alt={artist.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 60vw"
                          className="object-cover brightness-[0.28] contrast-[1.15] saturate-[0.62] sepia-[0.14] transition-all duration-1000 ease-out group-hover:scale-[1.035] group-hover:brightness-[0.67] group-hover:saturate-[0.82]"
                        />


                        {/* warm/cool room light */}

                        <div
                          className="nhb-window-flicker pointer-events-none absolute inset-0 opacity-50 transition-opacity duration-700 group-hover:opacity-75"
                          style={{
                            background: `
                              radial-gradient(
                                circle at 55% 45%,
                                ${light.room},
                                transparent 48%
                              )
                            `,
                            animationDelay:
                              `${index * -1.7}s`,
                          }}
                        />


                        {/* darkness */}

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/35" />


                        {/* window divisions */}

                        <div className="pointer-events-none absolute inset-y-0 left-[48%] w-px bg-black/35" />

                        <div className="pointer-events-none absolute inset-x-0 top-[47%] h-px bg-black/25" />


                        {/* glass reflection */}

                        <div className="pointer-events-none absolute -left-[8%] top-[4%] h-[35%] w-[55%] rotate-[-7deg] bg-white/[0.025] blur-xl" />


                        {/* subtle analog texture */}

                        <div className="nhb-window-noise pointer-events-none absolute inset-0 opacity-[0.045] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,.15)_0px,rgba(255,255,255,.15)_1px,transparent_1px,transparent_4px)]" />


                        {/* artist info */}

                        <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-5">

                          <div className="flex justify-between font-mono text-[7px] uppercase tracking-[0.2em] text-[#d0b884]/38">

                            <span>
                              CH{" "}
                              {String(
                                index + 1
                              ).padStart(2, "0")}
                            </span>

                            <span>
                              SIGNAL
                            </span>

                          </div>


                          <div>

                            <p className="mb-2 font-mono text-[7px] uppercase tracking-[0.2em] text-[#c4b395]/38">
                              {artist.location}
                            </p>


                            <h3 className="font-display text-[10vw] leading-[0.74] tracking-[-0.05em] text-[#d5c7aa] transition-all duration-500 group-hover:translate-x-2 group-hover:text-[#eee0c1] md:text-[4.8vw]">
                              {artist.name}
                            </h3>


                            <div className="mt-4 flex items-center justify-between border-t border-[#d5b77a]/12 pt-3">

                              <span className="font-mono text-[7px] uppercase tracking-[0.18em] text-[#ab9c82]/35">
                                {artist.role}
                              </span>

                              <span className="font-mono text-[8px] text-[#d1ae68]/50 transition-transform duration-300 group-hover:translate-x-1">
                                ↗
                              </span>

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                  </Link>
                )
              })}

          </div>


          <div className="mt-8 flex items-center justify-between border-t border-[#29231b] pt-4 font-mono text-[7px] uppercase tracking-[0.2em] text-[#756b59]/30">

            <span>
              04 active channels
            </span>

            <span>
              reception varies
            </span>

          </div>

        </div>


        <div className="mt-12 flex justify-end">

          <Link
            href="/affiliates"
            className="border-b border-[#9b815c]/25 pb-1 font-mono text-[8px] uppercase tracking-[0.22em] text-[#9b815c]/50 transition-colors hover:text-[#d3b475]"
          >
            View all transmissions ↗
          </Link>

        </div>

      </div>

    </section>
  )
}