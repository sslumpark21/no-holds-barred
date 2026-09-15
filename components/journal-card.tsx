import Image from "next/image"
import Link from "next/link"
import type { JournalEntry } from "@/lib/types"

export function JournalCard({ entry, large = false }: { entry: JournalEntry; large?: boolean }) {
  return (
    <Link href={`/journal/${entry.slug}`} className="group block">
      <div className={`relative overflow-hidden bg-ink/5 ${large ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
        <Image
          src={entry.cover || "/placeholder.svg"}
          alt={entry.title}
          fill
          sizes={large ? "100vw" : "(max-width: 768px) 100vw, 33vw"}
          className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-[1.03]"
        />
      </div>
      <div className="pt-4">
        <div className="flex items-center gap-3 eyebrow text-muted-ink">
          <span className="text-ink">{entry.category}</span>
          <span>{entry.date}</span>
          <span>{entry.readTime}</span>
        </div>
        <h3
          className={`mt-3 font-display uppercase leading-[0.95] group-hover:italic ${
            large ? "text-3xl md:text-5xl" : "text-2xl"
          }`}
        >
          {entry.title}
        </h3>
        <p className="mt-2 text-sm text-muted-ink max-w-xl leading-relaxed">{entry.excerpt}</p>
      </div>
    </Link>
  )
}
