"use client"

import Image from "next/image"
import Link from "next/link"

import { artists } from "@/lib/data"

const labelMembers = artists

const memberWindowImages: Record<string, string> = {
  moxli: "/images/moxli-member.jpg",
  matei: "/images/matei-member.png",
}

const caseTilts = ["-rotate-[2deg]", "-rotate-[0.5deg]", "rotate-[2deg]"]

export function ChannelWindows() {
  return (
    <section className="relative isolate overflow-hidden bg-[#030403] px-4 py-28 text-[#d8cdb7] md:px-7 md:py-40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(79,68,47,.14),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-20 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <span className="h-2 w-2 rounded-full bg-[#a53026] shadow-[0_0_9px_rgba(169,48,38,.7)]" />
              <p className="font-mono text-[8px] font-bold uppercase tracking-[0.26em] text-[#c6b79b]/72">
                no.holds.barred. / members
              </p>
            </div>

            <h2 className="mt-5 font-display text-[16vw] leading-[0.7] tracking-[-0.06em] text-[#afa694] md:text-[9vw]">
              Members.
            </h2>
          </div>

          <p className="max-w-xs font-mono text-[8px] font-semibold uppercase leading-[1.9] tracking-[0.17em] text-[#aa9d86]/68">
            Three rooms.
            <br />
            Three signals.
            <br />
            One channel.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl justify-items-center gap-12 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3 lg:gap-12">
          {labelMembers.map((artist, index) => (
            <Link
              key={artist.slug}
              href={`/artists/${artist.slug}`}
              className={`group block w-full max-w-[390px] transition-transform duration-300 ease-out hover:z-10 hover:-translate-y-2 hover:rotate-0 hover:scale-[1.02] focus-visible:z-10 focus-visible:-translate-y-2 focus-visible:rotate-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8cdb7] ${caseTilts[index] ?? ""}`}
            >
              <div className="relative aspect-square w-full">
                <div className="absolute left-[14%] top-[10.8%] h-[77%] w-[78%] overflow-hidden bg-[#141412]">
                  <Image
                    src={memberWindowImages[artist.slug] ?? artist.hero}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 78vw, (max-width: 1024px) 38vw, 27vw"
                    className="object-cover object-center brightness-[0.78] contrast-[1.06] saturate-[0.8] transition-[filter] duration-300 group-hover:brightness-[0.94] group-focus-visible:brightness-[0.94]"
                  />
                </div>

                <Image
                  src="/images/cd-case.png"
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="pointer-events-none select-none object-contain drop-shadow-[0_18px_18px_rgba(0,0,0,.78)]"
                />
              </div>

              <div className="mt-1 border-t border-[#c6b79b]/20 pt-3 text-[#d8cdb7]">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#b8a88e]/75">
                  Member / {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-3xl uppercase leading-none tracking-[-0.03em] text-[#ded0b3] md:text-4xl">
                  {artist.name}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
