import Link from "next/link"

const COLS = [
  {
    title: "Explore",
    links: [
      { label: "Artists", href: "/artists" },
      { label: "Curated Artists", href: "/affiliates" },
      { label: "Releases", href: "/releases" },
    ],
  },
  {
    title: "Read",
    links: [
      { label: "Journal", href: "/journal" },
      { label: "Events", href: "/events" },
      { label: "About", href: "/about" },
    ],
  },
  {
    title: "Elsewhere",
    links: [
      { label: "Instagram", href: "#" },
      { label: "Bandcamp", href: "#" },
      { label: "SoundCloud", href: "#" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-ink text-paper">
      <div className="px-4 md:px-6 pt-16 pb-32 md:pb-36">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-3xl md:text-4xl leading-none uppercase max-w-md">
              An independent creative brand &amp; collective.
            </p>
            <p className="mt-6 text-sm text-paper/60 max-w-sm leading-relaxed">
              Music, art and culture. Curated, not corporate. Sign transmissions arrive
              irregularly and without warning.
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <p className="eyebrow text-paper/50 mb-5">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm link-underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-6 border-t border-paper/15 flex flex-col md:flex-row justify-between gap-3 text-xs text-paper/50">
          <span>© {new Date().getFullYear()} no.holds.barred.</span>
          <span className="eyebrow">Music / Art / Culture</span>
        </div>
      </div>
    </footer>
  )
}
