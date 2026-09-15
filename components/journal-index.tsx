"use client"

import { useState } from "react"
import { JournalCard } from "./journal-card"
import type { JournalEntry } from "@/lib/types"

export function JournalIndex({ entries }: { entries: JournalEntry[] }) {
  const categories = ["All", ...Array.from(new Set(entries.map((e) => e.category)))]
  const [active, setActive] = useState("All")

  const filtered = active === "All" ? entries : entries.filter((e) => e.category === active)
  const [lead, ...rest] = filtered

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-line px-4 md:px-6 py-4 sticky top-[57px] md:top-[73px] bg-paper/90 backdrop-blur-md z-30">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActive(c)}
            className={`eyebrow px-3 py-2 border border-line transition-colors ${
              active === c ? "bg-ink text-paper border-ink" : "hover:border-ink"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="px-4 md:px-6 py-10">
        {lead ? (
          <div className="mb-12">
            <JournalCard entry={lead} large />
          </div>
        ) : (
          <p className="text-muted-ink text-sm">Nothing filed under this category yet.</p>
        )}
        <div className="grid gap-x-6 gap-y-12 md:grid-cols-3">
          {rest.map((e) => (
            <JournalCard key={e.slug} entry={e} />
          ))}
        </div>
      </div>
    </div>
  )
}
