import type { Metadata } from "next"
import { JournalIndex } from "@/components/journal-index"
import { journal } from "@/lib/data"

export const metadata: Metadata = {
  title: "Journal — no.holds.barred",
  description: "Interviews, studio visits, release stories, photography, essays, playlists and event recaps.",
}

export default function JournalPage() {
  return (
    <main>
      <header className="px-4 md:px-6 pt-16 md:pt-24 pb-8">
        <p className="eyebrow text-muted-ink mb-4">Editorial</p>
        <h1 className="font-display display-huge text-6xl md:text-9xl">Journal</h1>
        <p className="mt-6 max-w-xl text-sm md:text-base text-muted-ink leading-relaxed">
          Long-form and fragments. Conversations with the people we release, visits to the rooms
          where the work is made, and the occasional essay about why any of this matters.
        </p>
      </header>
      <JournalIndex entries={journal} />
    </main>
  )
}
