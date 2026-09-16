import Image from "next/image"
import type { Artist } from "@/lib/types"

const platforms = [
  "Instagram",
  "YouTube",
  "Spotify",
  "Apple Music",
  "SoundCloud",
  "Bandcamp",
]

export function ArtistProfile({ artist }: { artist: Artist }) {
  return (
    <main className="min-h-screen bg-[#030403] text-[#d8ccb4]">
      <section className="relative h-[70vh] min-h-[440px] w-full overflow-hidden bg-ink text-paper">
        <Image
          src={artist.hero || "/placeholder.svg"}
          alt={artist.name}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-ink/30" />
        <div className="relative z-10 flex h-full items-end px-4 py-8 md:px-6">
          <h1 className="font-display display-huge text-6xl md:text-[10vw]">
            {artist.name}
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <h2 className="mb-6 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#d8ccb4]/80">
          BIO
        </h2>
        {artist.bio.length > 0 ? (
          artist.bio.map((paragraph, index) => (
            <p key={index} className="mb-5 max-w-3xl text-lg leading-snug md:text-2xl">
              {paragraph}
            </p>
          ))
        ) : (
          <p className="text-lg md:text-2xl">To be announced.</p>
        )}
      </section>

      <section className="border-t border-[#d8ccb4]/20 px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-6 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#d8ccb4]/80">
            SOCIAL / STREAMING
          </h2>
          <div className="flex flex-wrap gap-3">
            {platforms.map((platform) => (
              <button
                key={platform}
                type="button"
                className="border border-[#d8ccb4]/35 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#d8ccb4]"
              >
                {platform}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}