import type { Metadata } from "next"
import { EventRow } from "@/components/event-row"
import { events } from "@/lib/data"

export const metadata: Metadata = {
  title: "Events — no.holds.barred",
  description: "Upcoming transmissions and past events from the no.holds.barred collective.",
}

export default function EventsPage() {
  const upcoming = events.filter((e) => e.status === "upcoming")
  const past = events.filter((e) => e.status === "past")

  return (
    <main>
      <header className="px-4 md:px-6 pt-16 md:pt-24 pb-8">
        <p className="eyebrow text-muted-ink mb-4">Transmissions</p>
        <h1 className="font-display display-huge text-6xl md:text-9xl">Events</h1>
        <p className="mt-6 max-w-xl text-sm md:text-base text-muted-ink leading-relaxed">
          Nights, performances and unannounced gatherings. Some are ticketed, some are found only by
          word of mouth.
        </p>
      </header>

      <section className="px-4 md:px-6 py-10 border-t border-line">
        <h2 className="eyebrow text-muted-ink mb-2">Upcoming</h2>
        <div>
          {upcoming.map((e) => (
            <EventRow key={e.slug} event={e} />
          ))}
        </div>
      </section>

      <section className="px-4 md:px-6 py-10 border-t border-line">
        <h2 className="eyebrow text-muted-ink mb-2">Past</h2>
        <div className="opacity-80">
          {past.map((e) => (
            <EventRow key={e.slug} event={e} />
          ))}
        </div>
      </section>
    </main>
  )
}
