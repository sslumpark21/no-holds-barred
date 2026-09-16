"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import { artists } from "@/lib/data"

const labelMembers = artists

const windowLayouts = [
  "md:col-span-7 md:h-[430px]",
  "md:col-span-5 md:h-[345px] md:mt-24",
  "md:col-span-8 md:col-start-3 md:h-[400px] md:mt-3",
]

const channelLight = [
  {
    room:
      "rgba(218, 173, 90, 0.29)",
    spill:
      "rgba(207, 139, 66, 0.19)",
  },
  {
    room:
      "rgba(171, 193, 111, 0.27)",
    spill:
      "rgba(116, 145, 83, 0.17)",
  },
  {
    room:
      "rgba(104, 134, 162, 0.27)",
    spill:
      "rgba(58, 81, 111, 0.18)",
  },
]

export function ChannelWindows() {
  const [
    activeChannel,
    setActiveChannel,
  ] = useState<number | null>(null)

  const activeLight =
    activeChannel !== null
      ? channelLight[
          activeChannel %
            channelLight.length
        ]
      : null

  return (
    <section className="relative isolate overflow-hidden bg-[#030403] px-4 py-28 text-[#d8cdb7] md:px-7 md:py-40">

      <style>
        {`
          @keyframes nhbMemberFlicker {
            0%,7%,10%,38%,41%,67%,70%,100% {
              opacity: .58;
            }

            8% {
              opacity: .42;
            }

            9% {
              opacity: .73;
            }

            39% {
              opacity: .46;
            }

            40% {
              opacity: .69;
            }

            68% {
              opacity: .48;
            }

            69% {
              opacity: .75;
            }
          }

          .nhb-member-flicker {
            animation:
              nhbMemberFlicker
              9s
              steps(1,end)
              infinite;
          }

          .nhb-member-title {
            -webkit-text-stroke:
              1px rgba(0,0,0,.85);

            text-shadow:
              -1px -1px 0 rgba(0,0,0,.85),
              1px -1px 0 rgba(0,0,0,.85),
              -1px 1px 0 rgba(0,0,0,.85),
              1px 1px 0 rgba(0,0,0,.85),
              0 5px 15px rgba(0,0,0,.8);
          }

          .nhb-member-small {
            text-shadow:
              0 1px 2px rgba(0,0,0,1),
              0 0 6px rgba(0,0,0,.8);
          }
        `}
      </style>


      {/* hovered-window light spill */}

      <div
        className="pointer-events-none absolute inset-0 transition-all duration-700"
        style={{
          opacity:
            activeChannel !== null
              ? 1
              : 0,

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


      {/* building texture */}

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

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_22%,rgba(0,0,0,.4)_68%,rgba(0,0,0,.88)_100%)]" />


      <div className="relative z-10 mx-auto max-w-7xl">

        {/* heading */}

        <div className="mb-20 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">

          <div>

            <div className="flex items-center gap-4">

              <span className="h-2 w-2 rounded-full bg-[#a53026] shadow-[0_0_9px_rgba(169,48,38,.7)]" />

              <p className="nhb-member-small font-mono text-[8px] font-bold uppercase tracking-[0.26em] text-[#c6b79b]/72">
                no.holds.barred. / roster
              </p>

            </div>


            <h2 className="nhb-member-title mt-5 font-display text-[16vw] leading-[0.7] tracking-[-0.06em] text-[#afa694] md:text-[9vw]">
              Members.
            </h2>

          </div>


          <p className="nhb-member-small max-w-xs font-mono text-[8px] font-semibold uppercase leading-[1.9] tracking-[0.17em] text-[#aa9d86]/68">
            Three rooms.
            <br />
            Three signals.
            <br />
            One channel.
          </p>

        </div>


        {/* windows */}

        <div className="relative border border-[#29231b] bg-[#080806] p-3 shadow-[0_40px_100px_rgba(0,0,0,.78)] md:p-5">

          <div className="absolute -top-3 left-[-8px] right-[-8px] h-3 border border-[#1c1813] bg-[#0e0c09]" />


          <div className="grid gap-5 md:grid-cols-12 md:gap-8">

            {labelMembers.map(
              (artist, index) => {

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
                      setActiveChannel(
                        index
                      )
                    }
                    onMouseLeave={() =>
                      setActiveChannel(
                        null
                      )
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

                    {/* external glow */}

                    <div
                      className="pointer-events-none absolute -inset-7 rounded-[35%] opacity-0 blur-[45px] transition-opacity duration-700 group-hover:opacity-100"
                      style={{
                        background:
                          light.spill,
                      }}
                    />


                    {/* window frame */}

                    <div className="absolute inset-0 border-[8px] border-[#15120f] bg-[#040403] shadow-[0_20px_35px_rgba(0,0,0,.65),inset_0_0_0_1px_rgba(255,255,255,.025)]">

                      <div className="absolute inset-[7px] overflow-hidden border border-[#3a3125] bg-black">

                        <Image
                          src={artist.hero}
                          alt={artist.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 65vw"
                          className="object-cover brightness-[0.32] contrast-[1.15] saturate-[0.66] sepia-[0.12] transition-all duration-1000 ease-out group-hover:scale-[1.035] group-hover:brightness-[0.7] group-hover:saturate-[0.88]"
                        />


                        {/* room light */}

                        <div
                          className="nhb-member-flicker pointer-events-none absolute inset-0 transition-opacity duration-700"
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


                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/30" />


                        {/* window bars */}

                        <div className="pointer-events-none absolute inset-y-0 left-[48%] w-px bg-black/35" />

                        <div className="pointer-events-none absolute inset-x-0 top-[47%] h-px bg-black/25" />


                        {/* reflection */}

                        <div className="pointer-events-none absolute -left-[8%] top-[4%] h-[35%] w-[55%] rotate-[-7deg] bg-white/[0.03] blur-xl" />


                        {/* analog texture */}

                        <div className="pointer-events-none absolute inset-0 opacity-[0.05] bg-[repeating-linear-gradient(0deg,rgba(255,255,255,.15)_0px,rgba(255,255,255,.15)_1px,transparent_1px,transparent_4px)]" />


                        {/* info */}

                        <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-6">

                          <div className="nhb-member-small flex justify-between font-mono text-[8px] font-bold uppercase tracking-[0.19em] text-[#e0c996]/70">

                            <span>
                              CH{" "}
                              {String(
                                index + 1
                              ).padStart(
                                2,
                                "0"
                              )}
                            </span>

                            <span>
                              MEMBER
                            </span>

                          </div>


                          <div>

                            <p className="nhb-member-small mb-3 font-mono text-[8px] font-bold uppercase tracking-[0.19em] text-[#cdbd9f]/68">
                              {artist.location}
                            </p>


                            <h3 className="nhb-member-title font-display text-[10vw] leading-[0.74] tracking-[-0.05em] text-[#ded0b3] transition-all duration-500 group-hover:translate-x-2 group-hover:text-[#f1dfb9] md:text-[4.8vw]">
                              {artist.name}
                            </h3>


                            <div className="mt-5 flex items-center justify-between border-t border-[#dabd82]/20 pt-4">

                              <span className="nhb-member-small font-mono text-[8px] font-bold uppercase tracking-[0.17em] text-[#c5b496]/65">
                                {artist.role}
                              </span>


                              <span className="nhb-member-small font-mono text-sm text-[#deb86e]/75 transition-transform duration-300 group-hover:translate-x-1">
                                ↗
                              </span>

                            </div>

                          </div>

                        </div>

                      </div>

                    </div>

                  </Link>
                )
              }
            )}

          </div>


          <div className="mt-8 flex items-center justify-between border-t border-[#332b21] pt-4">

            <span className="nhb-member-small font-mono text-[7px] font-bold uppercase tracking-[0.19em] text-[#a99b84]/65">
              03 active channels
            </span>

            <span className="nhb-member-small font-mono text-[7px] font-bold uppercase tracking-[0.19em] text-[#a99b84]/65">
              no.holds.barred.
            </span>

          </div>

        </div>

      </div>

    </section>
  )
}
