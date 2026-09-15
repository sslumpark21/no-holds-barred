import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "About — no.holds.barred",
  description: "no.holds.barred is an independent music label and multidisciplinary creative collective.",
}

const MANIFESTO = [
  "no.holds.barred is an independent music label and a multidisciplinary creative collective.",
  "We began as a series of unlabeled tapes and unannounced rooms. We remain suspicious of the word 'brand'.",
  "We release records. We stage nights. We publish a journal. We point at the artists we love, whether or not they are ours.",
  "Nothing here is corporate. Everything here is chosen.",
]

const PRINCIPLES = [
  { n: "01", t: "Curated, not corporate", d: "Every release, every affiliate, every night is chosen by hand. We would rather do less and mean it." },
  { n: "02", t: "The room is the record", d: "We treat live spaces and recordings as the same practice. Presence over polish." },
  { n: "03", t: "Point outward", d: "A scene is bigger than a label. The affiliates list is how we admit that." },
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
            Demos, collaborations, press, or an invitation to a room we should be in. We read
            everything, we reply to little. Persistence is a virtue.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div>
              <p className="eyebrow text-paper/50 mb-2">Demos</p>
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
            Meet the artists →
          </Link>
        </div>
      </section>
    </main>
  )
}
