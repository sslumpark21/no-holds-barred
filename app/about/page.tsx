import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "About — no.holds.barred.",
  description: "no.holds.barred. is a creative brand made by MoxLi and built as a multidisciplinary collective.",
}

const MANIFESTO = [
  "no.holds.barred. is a creative brand made by MoxLi and built as a multidisciplinary collective.",
  "It began with tapes and unannounced rooms. It keeps moving between forms.",
  "We make music, images, films, clothing, and objects. We share work we believe in.",
  "Nothing here is corporate. Everything here is chosen.",
]

const PRINCIPLES = [
  { n: "01", t: "Curated, not corporate", d: "Every release, every collaboration, every night is chosen by hand. We would rather do less and mean it." },
  { n: "02", t: "The room is the record", d: "We treat live spaces and recordings as the same practice. Presence over polish." },
  { n: "03", t: "Point outward", d: "A scene is bigger than any one project. Curated artists are the voices we want to point toward." },
  { n: "04", t: "No fixed medium", d: "Music, print, photography, film, clothing — whatever the idea needs." },
]

export default function AboutPage() {
  return (
    <main>
      <header className="px-4 md:px-6 pt-16 md:pt-28 pb-10">
        <p className="eyebrow text-muted-ink mb-6">About</p>
        <div className="max-w-5xl">
          {MANIFESTO.map((line, i) => (
            <p key={i} className="font-display uppercase text-3xl md:text-6xl leading-[0.95] mb-6">
              {line}
            </p>
          ))}
        </div>
      </header>

      <section className="px-4 md:px-6 py-12 md:py-16 border-t border-line grid gap-10 md:grid-cols-2">
        {PRINCIPLES.map((p) => (
          <div key={p.n} className="flex gap-6 border-t border-line pt-6">
            <span className="eyebrow text-muted-ink">{p.n}</span>
            <div>
              <h3 className="font-display text-2xl md:text-3xl uppercase leading-none">{p.t}</h3>
              <p className="mt-3 text-sm md:text-base text-muted-ink leading-relaxed max-w-md">{p.d}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="px-4 md:px-6 py-16 md:py-24 border-t border-line bg-ink text-paper">
        <div className="max-w-3xl">
          <h2 className="font-display display-huge text-4xl md:text-7xl">Get in touch</h2>
          <p className="mt-6 text-paper/70 leading-relaxed max-w-xl">
            Ideas, collaborations, press, or an invitation to a room we should be in. We read
            everything, we reply to little. Persistence is a virtue.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div>
              <p className="eyebrow text-paper/50 mb-2">Collaborate</p>
              <a href="mailto:demos@noholdsbarred.fm" className="text-sm link-underline">demos@noholdsbarred.fm</a>
            </div>
            <div>
              <p className="eyebrow text-paper/50 mb-2">Press</p>
              <a href="mailto:press@noholdsbarred.fm" className="text-sm link-underline">press@noholdsbarred.fm</a>
            </div>
            <div>
              <p className="eyebrow text-paper/50 mb-2">General</p>
              <a href="mailto:hello@noholdsbarred.fm" className="text-sm link-underline">hello@noholdsbarred.fm</a>
            </div>
          </div>
          <Link href="/artists" className="mt-12 inline-block eyebrow border border-paper px-6 py-3 hover:bg-paper hover:text-ink transition-colors">
            Meet the members →
          </Link>
        </div>
      </section>
    </main>
  )
}
