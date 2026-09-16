import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getJournalEntry, journal } from "@/lib/data"
import { JournalCard } from "@/components/journal-card"

export function generateStaticParams() {
  return journal.map((j) => ({ slug: j.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const entry = getJournalEntry(slug)
  if (!entry) return { title: "Journal — no.holds.barred" }
  return { title: `${entry.title} — no.holds.barred`, description: entry.excerpt }
}

export default async function JournalEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = getJournalEntry(slug)
  if (!entry) notFound()

  const related = journal.filter((j) => j.slug !== entry.slug).slice(0, 3)

  return (
    <main>
      <article>
        <header className="px-4 md:px-6 pt-12 md:pt-20 pb-8 max-w-4xl">
          <Link href="/journal" className="eyebrow text-muted-ink link-underline">
            ← Journal
          </Link>
          <div className="mt-8 flex items-center gap-3 eyebrow text-muted-ink">
            <span className="text-ink">{entry.category}</span>
            <span>{entry.date}</span>
            <span>{entry.readTime}</span>
          </div>
          <h1 className="mt-5 font-display display-huge text-5xl md:text-7xl">{entry.title}</h1>
          <p className="mt-6 text-xl md:text-2xl leading-snug text-muted-ink">{entry.excerpt}</p>
          <p className="mt-6 eyebrow">By {entry.author}</p>
        </header>

        <div className="relative aspect-[16/9] md:aspect-[16/7] bg-ink/5">
          <Image src={entry.cover || "/placeholder.svg"} alt={entry.title} fill priority sizes="100vw" className="object-cover" />
        </div>

        <div className="px-4 md:px-6 py-12 md:py-16">
          <div className="max-w-2xl mx-auto space-y-6">
            {entry.body.map((p, i) => (
              <p key={i} className={i === 0 ? "text-xl md:text-2xl leading-snug" : "text-base md:text-lg leading-relaxed text-muted-ink"}>
                {p}
              </p>
            ))}
          </div>
        </div>
      </article>

      <section className="px-4 md:px-6 py-12 md:py-16 border-t border-line">
        <h2 className="eyebrow text-muted-ink mb-8">Keep reading</h2>
        <div className="grid gap-x-6 gap-y-10 md:grid-cols-3">
          {related.map((e) => (
            <JournalCard key={e.slug} entry={e} />
          ))}
        </div>
      </section>
    </main>
  )
}
